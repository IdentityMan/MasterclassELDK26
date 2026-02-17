// Main Bicep deployment file for Azure resources:
// Custom Extensions for IAM Governance

targetScope = 'subscription'

// Main Parameters for Deployment
// TODO: Change these to match your environment
param applicationName string = 'iam-governance'
param orgName string = 'elven'
param projectName string = 'ELDK26'
param location string = 'norwayeast'
var resourceGroupName string = 'rg-${orgName}-${applicationName}'

// Your Microsoft Entra tenant Id
// TODO: Change these to match your environment
@secure()
param tenantId string = '0da56191-c95e-431f-acee-67e84aeb791a' 

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
resource assignAppRole 'Microsoft.Graph/appRoleAssignedTo@v1.0' = [for appRole in appRoles: {
  appRoleId: (filter(graphSpn.appRoles, role => role.value == appRole)[0]).id
  principalId: miSpn.id
  resourceId: graphSpn.id
}]

// OAuth policy settings for Logic App Custom Extension
// This is needed for Proof-of-Possession (PoP) authentication when Entra calls the Custom Extension Logic App 
var issuer string = 'https://sts.windows.net/${tenantId}/'
var audience string = environment().resourceManager
// Well-known First-Party App Id for Microsoft Entra Lifecycle Workflows
var firstparty_appid_lcw string = 'ce79fdc4-cd1d-4ea5-8139-e74d7dbe0bb7'
// Well-known First-Party App Id for Microsoft Entra Entitlement Management Access Package (EMAP)
var firstparty_appid_emap string = '810dcf14-1858-4bf2-8134-4c369fa3235b'
var u string = replace(environment().resourceManager, 'https://', '')
var m string = 'POST'
var p_emap string = resourceId('Microsoft.Logic/workflows', 'logicapp-${toLower(replace(applicationName,' ',''))}-${toLower(projectName)}-provision-priv-account')
var p_lcw string = resourceId('Microsoft.Logic/workflows', 'logicapp-${toLower(replace(applicationName,' ',''))}-${toLower(projectName)}-lcw-test')

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

// Creating Logic App for Custom Extension - Access Package Catalog
// Using AVM Module for Logic App Workflow
module logicAppCustomExtensionEmap 'br/public:avm/res/logic/workflow:0.5.3' = {
  name: 'logicAppDeploymentCustomExtensionEmap'
  scope: resourceGroup(rg.name)
  params: {
    // Required parameters
    name: 'logicapp-${toLower(replace(applicationName,' ',''))}-${toLower(projectName)}-provision-priv-account'
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
      Condition:{
        type: 'If'
        expression: {
          and: [
            {
              equals: [
                '@{triggerBody()?[\'AccessPackageCatalog\']?[\'Id\']}', '9649775e-1b82-41b6-b9fc-099e36ab4451'
              ]
            }
          ]
        }
        actions: {
          Condition_2: {
            type: 'If'
            expression: {
              and: [
                {
                  equals: [
                    '@{triggerBody()?[\'Stage\']}', 'CustomExtensionConnectionTest'
                  ]
                }
              ]
            }
            actions: {}
            else: {
              actions: {}
            }
          }
        }
        else: {
          actions: {}
        }
        runAfter: {}
      }   
      HTTP: {
        type: 'Http'
        runAfter: {Condition: ['Succeeded']}
        inputs: {
          uri: 'https://graph.microsoft.com/v1.0/users/$count?$filter=userType%20ne%20\'guest\''
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
    name: 'logicapp-${toLower(replace(applicationName,' ',''))}-${toLower(projectName)}-lcw-test'
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
    workflowActions: {  
    }
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

