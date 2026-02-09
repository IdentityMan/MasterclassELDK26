param assignmentName string
param partnerRegistrationId string

resource rgAssignment 'Microsoft.ManagedServices/registrationAssignments@2022-10-01' = {
  name: assignmentName
  properties: {
    registrationDefinitionId: partnerRegistrationId
  }
}
