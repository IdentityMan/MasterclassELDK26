# Lab 5 - Maester and Identity Security Posture

## 5.1 Install Maester

Use the following cmdlets to install Maester:

```powershell
Install-PSResource Pester -Scope CurrentUser
Install-PSResource Maester -Scope CurrentUser
```

> ℹ️ **Note**  
> Use `Install-PSResource` for better security and performance over the legacy cmdlet `Install-Module`.

## 5.2 Install public tests

Navigate to a folder that you want to use to store Maester tests and test results:

```powershell
md maester-tests
cd maester-tests
Install-MaesterTests
```

## 5.3 Review configuration and parameters

Open the "maester-tests" folder in your favorite IDE (e.g., VS Code) to review the `GlobalSettings` and `Severity` of EIDSCA or other checks.  
Use the following structure to define your break-glass accounts:

```json
{
  "GlobalSettings": {
    "EmergencyAccessAccounts": [
      {
        "Id": "59780ce8-d2f3-4e41-a491-6c327a75879d",
        "Type": "User"
      },
      {
        "Id": "7c1c1467-e16f-4039-a0f7-8e3e2d0d3848",
        "Type": "User"
      }
    ]
  }
}
```

> ℹ️ **Note**  
> Configuration can also be adjusted by using the settings page in the Maester report.

## 5.4 Connect to Maester

Use `Connect-MtMaester` and consent to the permission scopes (if not already granted).

## 5.5 Evaluation of EIDSCA tenant-level settings and CA

Run the command `Invoke-Maester -Tag EIDSCA, CA` and review the results as well as the generated files in the `test-results` subfolder of your `maester-tests` folder.

> 💡 **Tip**  
> Consider the following details in the test results:  
> - Severity level  
> - Deep links to Graph Explorer and the portal UI  
> - Test details, including mapping to CISA  
> - The "Learn more" link, which also guides you to "How to fix" and "MITRE ATT&CK mapping"

## 5.6 Optional: Run advanced checks for applications and Exposure Management critical assets.
Run the command `Invoke-Maester -Tag App, Recommendation, XSPM -IncludeLongRunning` to get test results for application identities and critical assets from Exposure Management. The execution of this check can take up to 15 minutes.

## 5.7 Create your own custom Maester check

Use the steps and example in the Maester documentation to create your own test:
https://maester.dev/docs/writing-tests/formatting-test-results#marking-tests-as-investigate

For your convenience, here is the first test we are going to create.

It checks if there are any conditional access policies in "report-only" mode in the tenant. All report-only are shown in the results and require investigation to either enable or remove them.

```powershell
Describe "ContosoEntraConfig" -Tag  "Contoso" {
    It "CT0002: Read-only CA policies should be reviewed" {

        $policies = Invoke-MtGraphRequest -RelativeUri "identity/conditionalAccess/policies"

        $readOnlyPolicies = $policies | Where-Object { $_.state -eq 'enabledForReportingButNotEnforced' }

        $description = "Checks if read-only conditional access policies should be reviewed."

        if ($readOnlyPolicies.Count -gt 0) {
            $result = "Found $($readOnlyPolicies.Count) conditional access policies that are in report-only mode. Please review if this is intended.`n`n"
            $result += "| Policy Name | State |`n"
            $result += "| --- | --- |`n"
            foreach ($policy in $readOnlyPolicies) {
                $result += "| $($policy.displayName) | $($policy.state) |`n"
            }
            Add-MtTestResultDetail -Description $description -Result $result -Investigate
        } else {
            Add-MtTestResultDetail -Description $description -Result "Well done. No report-only policies were found to investigate."
        }

        $readOnlyPolicies.Count | Should -Be 0 -Because "Conditional access policies should not be in read-only mode for the long term. Please review and enable the policy."
    }
}
```

The previous test results was very bare bones and did not provide click through options for the user to easily navigate to the portal or Graph Explorer to investigate further. We can enhance the test result by adding deep links to the portal and Graph Explorer.

Maester includes a number of helper cmdlets and shortcuts to make this easy, in this lab we will use

- `Get-MtConditionalAccessPolicy` - Retrieves conditional access policies
- `-GraphObjects` - This parameter can be used to pass the objects that are relevant to the test result, which will then be used by Maester to create deep links
- `-GraphObjectType` - This parameter is used in conjunction with `-GraphObjects` to specify the type of the objects being passed, which helps Maester to create the correct deep links.
    - A number of GraphObjectTypes are supported, including `User`, `Application`, `ConditionalAccess`, `Role`, and more.

```powershell
Describe "ContosoEntraConfig" -Tag  "Contoso" {
    It "CT0003: Read-only CA policies should be reviewed" {

        $policies = Get-MtConditionalAccessPolicy

        $readOnlyPolicies = $policies | Where-Object { $_.state -eq 'enabledForReportingButNotEnforced' }

        $description = "Checks if read-only conditional access policies should be reviewed."

        if ($readOnlyPolicies.Count -gt 0) {
            $result = "Found $($readOnlyPolicies.Count) conditional access policies that are in report-only mode. Please review if this is intended.`n`n%TestResult%"
            Add-MtTestResultDetail -Description $description -Result $result -Investigate -GraphObjects $readOnlyPolicies -GraphObjectType ConditionalAccess
        } else {
            Add-MtTestResultDetail -Description $description -Result "Well done. No report-only policies were found to investigate."
        }

        $readOnlyPolicies.Count | Should -Be 0 -Because "Conditional access policies should not be in read-only mode for the long term. Please review and enable the policy."
    }
}
```
