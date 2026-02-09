// Main Bicep deployment file for Azure resources:
// Azure Lighthouse setup for Cross-Tenant access

targetScope = 'subscription'

// Main Parameters for Deployment
// TODO: Change these to match your environment
param applicationName string = 'iam-governance'
param orgName string = 'your-org-name'
param location string = 'norwayeast'
param resourceGroupName string = 'rg-${orgName}-${applicationName}'

// Tenants and Object IDs for Lighthouse setup
// TODO: Change these to match your environment
param tenantId string = '00000000-0000-0000-0000-000000000000' // Tenant ID of the tenant you want to manage
param groupObjectId string = '00000000-0000-0000-0000-000000000000' // Object ID of the group in the tenant that will have access (e.g., a security group)
param groupNameDescription string = 'Describe the Name or Description of the Group for the Object ID above' // Display or Descriptive name of the group for reference 
param roleDefinitionId string = 'b24988ac-6180-42a0-ab88-20f7382dd24c' // Role Definition ID for the access level (e.g., Contributor) 

// Resource Tags for all resources deployed with this Bicep file
// TODO: Change, add or remove these to match your environment
var defaultTags = {
  'service-name': 'IAM Governance'
  'deployment-type': 'Bicep'
  'project-name': 'ELDK26'
  'last-updated-by-deployer': az.deployer().userPrincipalName
}

// Create Resource Group for IAM Azure Resources
resource rg 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: location
  tags: defaultTags
}

// Create Azure Lighthouse Registration Definition for Cross-Tenant Access at Subscription Level
resource partnerRegistration 'Microsoft.ManagedServices/registrationDefinitions@2022-10-01' = {
  name: guid('lighthouse-definition-${orgName}-${applicationName}-${tenantId}')
  properties: {
    registrationDefinitionName: '${orgName} - ${applicationName}'
    description: '${orgName} - ${applicationName} resources for ${tenantId}'
    managedByTenantId: tenantId
    authorizations: [
      {
        principalId: groupObjectId
        principalIdDisplayName: groupNameDescription
        roleDefinitionId: roleDefinitionId
      }
    ]
  }
}

// Assign the Azure Lighthouse Registration Definition to the Resource Group
module partnerAssignment 'modules/lighthouse/registration-assignment.bicep' = {
  name: guid('lighthouse-assignment-${orgName}-${applicationName}-${tenantId}')
  scope: resourceGroup(rg.name)
  params: {
    partnerRegistrationId: resourceId('Microsoft.ManagedServices/registrationDefinitions', guid('lighthouse-definition-${orgName}-${applicationName}-${tenantId}'))
    assignmentName: guid('lighthouse-definition-${orgName}-${applicationName}-${tenantId}')
  }
  dependsOn: [
    partnerRegistration
  ]
}

