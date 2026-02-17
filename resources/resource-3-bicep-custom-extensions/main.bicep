// Main Bicep deployment file for Azure resources:
// Custom Extensions for IAM Governance

targetScope = 'subscription'

// Main Parameters for Deployment
// TODO: Change these to match your environment
param applicationName string = 'iam-governance'
param orgName string = '<your-org-name>'
param projectName string = 'ELDK26'
param location string = 'norwayeast'
var resourceGroupName string = 'rg-${orgName}-${applicationName}'

// Your Microsoft Entra tenant Id
// TODO: Change these to match your environment
@secure()
param tenantId string // = 'your-tenant-id-here'

// Resource Tags for all resources deployed with this Bicep file
// TODO: Change, add or remove these to match your environment
var defaultTags = {
  'service-name': 'IAM Governance'
  'deployment-type': 'Bicep'
  'project-name': projectName
  'last-updated-by-deployer': az.deployer().userPrincipalName
}

// Create Resource Group for IAM Azure Resources
// PS! If you already have a resource group created from resource-1 (Azure Lighthouse), 
// comment out this section and uncomment the next section to use the existing resource group instead.
/* 
resource rg 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: location
  tags: defaultTags
}
 */
resource rg 'Microsoft.Resources/resourceGroups@2025-04-01' existing = {
  name: resourceGroupName
}

// Creating User Assigned Managed Identity for Custom Extension
// Using AVM module for User Assigned Managed Identity
module userAssignedIdentity 'br/public:avm/res/managed-identity/user-assigned-identity:0.5.0' = {
  name: 'userAssignedIdentityDeployment'
  scope: resourceGroup(rg.name)
  params: {
    // Required parameters
    name: 'mi-${toLower(replace(applicationName,' ',''))}-${toLower(projectName)}'
  }
}

// Initialize the Graph provider
extension microsoftGraphV1

// Get the Principal Id of the User Managed Identity resource
resource miSpn 'Microsoft.Graph/servicePrincipals@v1.0' existing = {
  appId: userAssignedIdentity.outputs.clientId
}

// Get the Resource Id of the Graph resource in the tenant
resource graphSpn 'Microsoft.Graph/servicePrincipals@v1.0' existing = {
  appId: '00000003-0000-0000-c000-000000000000'
}

// Define the App Roles to assign to the Managed Identity
param appRoles array = [
  'ProvisioningLog.Read.All'
  'SynchronizationData-User.Upload'
  'User.Read.All'
]

// Looping through the App Roles and assigning them to the Managed Identity
resource assignAppRole 'Microsoft.Graph/appRoleAssignedTo@v1.0' = [
  for appRole in appRoles: {
    appRoleId: (filter(graphSpn.appRoles, role => role.value == appRole)[0]).id
    principalId: miSpn.id
    resourceId: graphSpn.id
  }
]

// The following section will provision two Logic Apps that will be used as Custom Extensions 
// for Microsoft Entra Entitlement Management and Lifecycle Workflows.
// Example names are provided in the following parameters  naming convention.
param logicAppNameEmap string = 'logicapp-${toLower(replace(applicationName,' ',''))}-${toLower(projectName)}-provision-priv-account'
param logicAppNameLcw string = 'logicapp-${toLower(replace(applicationName,' ',''))}-${toLower(projectName)}-lcw-bootstrap-user'

// OAuth policy settings for Logic App Custom Extension
// This is needed for Proof-of-Possession (PoP) authentication when Entra calls the Custom Extension Logic App 
var issuer string = 'https://sts.windows.net/${tenantId}/'
var audience string = substring(environment().resourceManager, 0, length(environment().resourceManager) - 1)
// Well-known First-Party App Id for Microsoft Entra Lifecycle Workflows
var firstparty_appid_lcw string = 'ce79fdc4-cd1d-4ea5-8139-e74d7dbe0bb7'
// Well-known First-Party App Id for Microsoft Entra Entitlement Management Access Package (EMAP)
var firstparty_appid_emap string = '810dcf14-1858-4bf2-8134-4c369fa3235b'
var u string = replace(replace(environment().resourceManager, 'https://', ''), '/', '')
var m string = 'POST'
var p_emap string = '/subscriptions/${subscription().subscriptionId}/resourceGroups/${rg.name}/providers/Microsoft.Logic/workflows/${logicAppNameEmap}'
var p_lcw string = '/subscriptions/${subscription().subscriptionId}/resourceGroups/${rg.name}/providers/Microsoft.Logic/workflows/${logicAppNameLcw}'

var oauthClaimsLcw = [
  { name: 'iss', value: issuer }
  { name: 'aud', value: audience }
  { name: 'appid', value: firstparty_appid_lcw }
  { name: 'u', value: u }
  { name: 'm', value: m }
  { name: 'p', value: p_lcw }
]

var oauthClaimsEmap = [
  { name: 'iss', value: issuer }
  { name: 'aud', value: audience }
  { name: 'appid', value: firstparty_appid_emap }
  { name: 'u', value: u }
  { name: 'm', value: m }
  { name: 'p', value: p_emap }
]

// For Access Package Catalog Custom Extension, we need the Catalog Id from your environment
// TODO: Change this to match the Catalog Id in your environment
// You can find this in the URL or as the Object Id when you open the Catalog in the Entra ID Governance Portal 
param catalogId string // = '<your-catalog-id-here>'

// Creating Logic App for Custom Extension - Access Package Catalog
// Using AVM Module for Logic App Workflow
module logicAppCustomExtensionEmap 'br/public:avm/res/logic/workflow:0.5.3' = {
  name: 'logicAppDeploymentCustomExtensionEmap'
  scope: resourceGroup(rg.name)
  params: {
    // Required parameters
    name: logicAppNameEmap
    location: location
    managedIdentities: {
      userAssignedResourceIds: [
        userAssignedIdentity.outputs.resourceId
      ]
    }
    tags: defaultTags
    workflowTriggers: {
      request: {
        type: 'Request'
        kind: 'Http'
        inputs: {
          schema: loadJsonContent('schema-emap-extension.json')
        }
        operationOptions: 'IncludeAuthorizationHeadersInOutputs'
      }
    }
    workflowActions: {
      Condition_CatalogId: {
        type: 'If'
        expression: {
          and: [
            {
              equals: [
                '@{triggerBody()?[\'AccessPackageCatalog\']?[\'Id\']}'
                catalogId
              ]
            }
          ]
        }
        actions: {
          Condition_ConnectionTest: {
            type: 'If'
            expression: {
              and: [
                {
                  equals: [
                    '@{triggerBody()?[\'Stage\']}'
                    'CustomExtensionConnectionTest'
                  ]
                }
              ]
            }
            actions: {}
            else: {
              actions: {
                Get_User_Details: {
                  type: 'Http'
                  inputs: {
                    uri: 'https://graph.microsoft.com/v1.0/users/@{triggerBody()?[\'Assignment\']?[\'Target\']?[\'ObjectId\']}?$select=displayName,givenName,surname,mailNickname,mobilePhone,jobTitle,preferredLanguage,officeLocation,accountEnabled,companyName,department,employeeId,employeeOrgData,employeeHireDate,employeeLeaveDateTime,usageLocation'
                    method: 'GET'
                    headers: {
                      consistencyLevel: 'eventual'
                    }
                    authentication: {
                      type: 'ManagedServiceIdentity'
                      identity: userAssignedIdentity.outputs.resourceId
                      audience: 'https://graph.microsoft.com'
                    }
                  }
                }
              }
            }
          }
        }
        else: {
          actions: {}
        }
        runAfter: {}
      }
    }
    triggersAccessControlConfiguration: {
      openAuthenticationPolicies: {
        policies: {
          'AzureADEntitlementManagementAuthPOPAuthPolicy': {
            type: 'AADPOP'
            claims: oauthClaimsEmap
          }
        }
      }
      sasAuthenticationPolicy: {
        state: 'Disabled'
      }
    }
  }
}

// Creating Logic App for Custom Extension - Lifecycle Workflows
// Using AVM Module for Logic App Workflow
module logicAppCustomExtensionLcw 'br/public:avm/res/logic/workflow:0.5.3' = {
  name: 'logicAppDeploymentCustomExtensionLcw'
  scope: resourceGroup(rg.name)
  params: {
    // Required parameters
    name: logicAppNameLcw
    location: location
    managedIdentities: {
      userAssignedResourceIds: [
        userAssignedIdentity.outputs.resourceId
      ]
    }
    tags: defaultTags
    workflowTriggers: {
      manual: {
        type: 'Request'
        kind: 'Http'
        inputs: {
          schema: loadJsonContent('schema-lcw-extension.json')
        }
        operationOptions: 'IncludeAuthorizationHeadersInOutputs'
      }
    }
    workflowActions: {}
    triggersAccessControlConfiguration: {
      openAuthenticationPolicies: {
        policies: {
          'AzureADLifecycleWorkflowsAuthPOPAuthPolicy': {
            type: 'AADPOP'
            claims: oauthClaimsLcw
          }
        }
      }
      sasAuthenticationPolicy: {
        state: 'Disabled'
      }
    }
  }
}
