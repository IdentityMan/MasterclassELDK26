# Lab 3 - Maester and Identity Security Posture

## 3.1 Install Maester

Use the following cmdlets to install Maester:

```powershell
Install-PSResource Pester -Scope CurrentUser
Install-PSResource Maester -Scope CurrentUser
```

> ℹ️ **Note**  
> Use `Install-PSResource` for better security and performance over the legacy cmdlet `Install-Module`.

## 3.2 Install public tests

Navigate to a folder that you want to use to store Maester tests and test results:

```powershell
md maester-tests
cd maester-tests
Install-MaesterTests
```

## 3.3 Review configuration and parameters

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

## 3.4 Connect to Maester

Use `Connect-MtMaester` and consent to the permission scopes (if not already granted).

## 3.5 Evaluation of EIDSCA tenant-level settings and CA

Run the command `Invoke-Maester -Tag EIDSCA, CA` and review the results as well as the generated files in the `test-results` subfolder of your `maester-tests` folder.

> 💡 **Tip**  
> Consider the following details in the test results:  
> - Severity level  
> - Deep links to Graph Explorer and the portal UI  
> - Test details, including mapping to CISA  
> - The "Learn more" link, which also guides you to "How to fix" and "MITRE ATT&CK mapping"

## 3.6 Optional: Run advanced checks for applications and Exposure Management critical assets.
Run the command Invoke-Maester -Tag App, Recommendation, XSPM -IncludeLongRunning to get test results for application identities and critical assets from Exposure Management. The execution of this check can take up to 15 minutes.

## 3.7 Create your own custom Maester check
Use the steps and example in the Maester documentation to create your own test:
https://maester.dev/docs/writing-tests/formatting-test-results#marking-tests-as-investigate
