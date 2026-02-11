// Main Bicep deployment file for Azure resources:
// Custom Extensions for IAM Governance

targetScope = 'subscription'

// Main Parameters for Deployment
// TODO: Change these to match your environment
param applicationName string = 'iam-governance'
param orgName string = 'your-org-name'
param location string = 'norwayeast'
param resourceGroupName string = 'rg-${orgName}-${applicationName}'

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

// Creating User Assigned Managed Identity for Custom Extension
// ... code will be added shortly

// Creating Logic Apps for Custom Extension
// ... code will be added shortly

