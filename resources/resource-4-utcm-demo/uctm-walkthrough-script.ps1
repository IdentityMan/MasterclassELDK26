#region 1. Define resources to include in the snapshot
<# Define the scope and consider limitations
- 20k Resources per Tenant per Month, 200 Snaphots per Tenant per Month
- 30 Monitors per Tenant, 6 Hours Minimum Frequency for Monitors, 800 Resources Checks per Day.
- 30 days retention for drifts and 7 days for snapshot results.
#>

# List of supported resources: https://learn.microsoft.com/en-us/graph/utcm-entra-resources

$AvailableResources = @(
    "microsoft.entra.administrativeUnit",
    "microsoft.entra.application",
    "microsoft.entra.authenticationContextClassReference",
    "microsoft.entra.authenticationMethodPolicy",
    "microsoft.entra.authenticationMethodPolicyAuthenticator",
    "microsoft.entra.authenticationMethodPolicyEmail",
    "microsoft.entra.authenticationMethodPolicyFido2",
    "microsoft.entra.authenticationMethodPolicySms",
    "microsoft.entra.authenticationMethodPolicySoftware",
    "microsoft.entra.authenticationMethodPolicyTemporary",
    "microsoft.entra.authenticationMethodPolicyVoice",
    "microsoft.entra.authenticationMethodPolicyX509",
    "microsoft.entra.authenticationStrengthPolicy",
    "microsoft.entra.authorizationPolicy",
    "microsoft.entra.conditionalAccessPolicy",
    "microsoft.entra.crossTenantAccessPolicy",
    "microsoft.entra.crossTenantAccessPolicyConfigurationDefault",
    "microsoft.entra.crossTenantAccessPolicyConfigurationPartner",
    "microsoft.entra.entitlementManagementAccessPackage",
    "microsoft.entra.entitlementManagementAccessPackageAssignmentPolicy",
    "microsoft.entra.entitlementManagementAccessPackageCatalog",
    "microsoft.entra.entitlementManagementAccessPackageCatalogResource",
    "microsoft.entra.entitlementManagementConnectedOrganization",
    "microsoft.entra.externalIdentityPolicy",
    "microsoft.entra.group",
    "microsoft.entra.groupLifecyclePolicy",
    "microsoft.entra.namedLocationPolicy",
    "microsoft.entra.roleDefinition",
    "microsoft.entra.roleEligibilityScheduleRequest",
    "microsoft.entra.roleSetting",
    "microsoft.entra.securityDefaults",
    "microsoft.entra.servicePrincipal",
    "microsoft.entra.socialIdentityProvider",
    "microsoft.entra.tenantDetails",
    "microsoft.entra.tokenLifetimePolicy",
    "microsoft.entra.user"
)
$ResourcesToInclude = @(
    $AvailableResources | Where-Object { $_ -like "*conditionalAccessPolicy*" }
)
#endregion

#region 2. Add service principal for UTCM and assign permissions

# Create a service principal for UTCM
$TenantId = Read-Host -Prompt "Enter your tenant ID"
Connect-MgGraph -Scopes "Application.ReadWrite.All", "AppRoleAssignment.ReadWrite.All" -TenantId $TenantId
$UtcmAppId = "03b07b79-c5bc-4b5e-9bfa-13acf4a99998"

# Check if application (Service Principal) exists
$UTCM = Get-MgServicePrincipal -Filter "AppId eq '$UtcmAppId'" -ErrorAction SilentlyContinue
if (-not $UTCM) {
    Write-Host "Creating Service Principal for UTCM AppId: $UtcmAppId"
    New-MgServicePrincipal -AppId $UtcmAppId
    $UTCM = Get-MgServicePrincipal -Filter "AppId eq '$UtcmAppId'"
} else {
    Write-Host "Service Principal already exists for UTCM AppId: $UtcmAppId"
}

# Assign the required permissions to the service principal
$permissions = @('User.Read.All', 'Application.Read.All', 'Group.Read.All', 'Policy.Read.All')
$Graph = Get-MgServicePrincipal -Filter "AppId eq '00000003-0000-0000-c000-000000000000'"

# Get existing assignments to avoid duplicates
$ExistingAssignments = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $UTCM.Id -All

foreach ($requestedPermission in $permissions) {
    $AppRole = $Graph.AppRoles | Where-Object { $_.Value -eq $requestedPermission }
    
    # Check if permission is already assigned
    $IsAssigned = $ExistingAssignments | Where-Object { $_.AppRoleId -eq $AppRole.Id -and $_.ResourceId -eq $Graph.Id }

    if (-not $IsAssigned) {
        Write-Host "Assigning permission: $requestedPermission"
        $body = @{
            AppRoleId   = $AppRole.Id
            ResourceId  = $Graph.Id
            PrincipalId = $UTCM.Id
        }
        New-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $UTCM.Id -BodyParameter $body
    } else {
        Write-Host "Permission already assigned: $requestedPermission"
    }
}
#endregion

#region 3. Connect to Microsoft Graph with the required scopes
Connect-MgGraph -Scopes "ConfigurationMonitoring.ReadWrite.All"
#endregion

#region 4. Create a snapshot of Conditional Access policy configurations via Microsoft Graph PowerShell SDK
$SnapshotDisplayName = "Entra CAP Baseline"

$Uri = "beta/admin/configurationManagement/configurationSnapshots/createSnapshot"
$Body = @{
    displayName = $SnapshotDisplayName
    description = "Baseline for your configured Conditional Access policies"
    resources   = @( "$($ResourcesToInclude)" )
}
$CreatedSnapshot = Invoke-MgGraphRequest -Uri $Uri -Method POST -Body $Body
$CreatedSnapshot
#endregion

# Wait until the snapshot job is completed before proceeding to the next steps.
Invoke-MgGraphRequest -Method GET -Uri "beta/admin/configurationManagement/configurationSnapshotJobs/$($CreatedSnapshot.id)"

#region 5. Get the configuration snapshot that was just created
$Filter = "displayName eq '$($SnapshotDisplayName)'"
$Uri = "beta/admin/configurationManagement/configurationSnapshotJobs/?`$filter=$Filter"

# Fetch the snapshot details
$Snapshot = Invoke-MgGraphRequest -Uri $Uri -Method GET -OutputType PSObject | Select -Expand Value

# Extract the resource location URI for snapshot settings
$ResourceLocation = $Snapshot[0].resourceLocation

# Retrieve snapshot configuration details
$Resources = Invoke-MgGraphRequest -Uri $ResourceLocation -Method GET

# Filter the resources array within the returned object
$DesiredResources = [PSCustomObject]@{
    displayName = $Resources.displayName
    description = $Resources.description
    resources   = @($Resources.resources | Where-Object { 
            $_.properties.IncludeRoles -contains "Global Administrator" `
                -and $_.properties.IncludeApplications -contains "All" `
                -and ($_.properties.AuthenticationStrength -eq "Phishing-resistant MFA" -or $_.properties.AuthenticationStrength -eq "FIDO2 Security Keys")
        }
    )
}
$DesiredResources.resources | ForEach-Object {
    Write-Host "Resource Display Name: $($_.displayName)"
}
#endregion

#region 6. Set up a configuration monitor with the snapshot data
$MonitorDisplayName = "CA for Global Admin"

$Uri = "beta/admin/configurationManagement/configurationMonitors"
$body = @{
    displayName = $MonitorDisplayName
    description = "Monitor critical CA"
    baseline    = @{
        displayName = $DesiredResources.displayName
        description = $DesiredResources.description
        resources   = ($DesiredResources.resources | Select-Object -Property displayName, resourceType, properties)
    }
} | ConvertTo-Json -Depth 10
Invoke-MgGraphRequest -Uri $Uri -Method POST -Body $body

#endregion

#region 7. Retrieve the configuration monitor details
$Filter = "displayName eq '$($MonitorDisplayName)'"
$Uri = "beta/admin/configurationManagement/configurationMonitors/?`$filter=$Filter"
$MonitorJob = Invoke-MgGraphRequest -Uri $Uri -Method GET -OutputType PSObject | Select -Expand Value
#endregion

#region 8. Get the monitoring results from the configuration monitor
$Filter = "monitorId eq '$($MonitorJob[0].id)'"
$Uri = "/beta/admin/configurationManagement/configurationMonitoringResults?`$filter=$Filter"
$MonitorResults = Invoke-MgGraphRequest -Uri $Uri -Method GET -OutputType PSObject | Select -expand Value
#endregion

# Wait for necessary time based on the frequency set for the monitor to get the monitoring results before proceeding to analyze the results for any drifts in the Conditional Access policies.

#region 9. Analyze the monitoring results for any drifts in the Conditional Access policies
foreach ($result in $MonitorResults) {
    if ($result.driftsCount -gt 0) {
        Write-Host "Drift detected in monitor: $($MonitorJob[0].displayName)"
        $uri = "beta/admin/configurationManagement/configurationDrifts/?`$filter=monitorId eq '$($MonitorJob[0].id)'"
        $DriftedResources = Invoke-MgGraphRequest -Uri $uri -Method GET -OutputType PSObject | Select -Expand Value        
        foreach ($DriftedResource in $DriftedResources) {
            $DriftedResource
        }
    } else {
        Write-Host "No drift detected in monitor: $($MonitorJob[0].displayName)"
    }
}
#endregion

