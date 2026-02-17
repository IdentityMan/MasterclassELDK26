# Lab 2 - Entitlement Management

The activities in this lab will all be executed within the [Entitlement Management](https://entra.microsoft.com/#view/Microsoft_AAD_ERM/DashboardBlade/~/GettingStarted) & [Lifecycle Workflows](https://entra.microsoft.com/#view/Microsoft_AAD_LifecycleManagement/CommonMenuBlade/~/overview) blade in Entra ID. For this you need at a bear minimum 'Identity Governance Administrator' and 'Lifecycle Workflow Administrator'.

In this lab you will create separate privileged accounts via an Access Package request, and that request will upon approval and successful delivery, provision a separate privileged account for the targeted user.

The lab will use the API-driven Provisioning API created in Lab 1, and will consist of:

1. An Access Package for requesting a Privileged Account.
    1. A self-service, direct assignment or manager assigned policy for requesting the Access Package for the target user.
    1. Add Approvals as needed to govern who are approved to get a Privileged Role.
    1. No resource roles are needed for the Access Package, but you can optionally add a Team or similar for maintaining and documenting routines, processes and guidelines for privileged users.
1. A Custom Extension connected to the Access Package for the Stage "Access is Granted".
    1. This Custom Extension Logic App must be pre-created in the Catalog.
    1. The Logic App will retrieve the target user of the request for Privileged Access, get user details from Graph API, and push a SCIM payload to the Provisioning API for creating the Privileged Account.
    1. The Logic App will use a Managed Identity authorized to request the necessary Graph API resources and permissions.

Creating a Logic App requires access to an Azure Subscription for your Test/Demo tenant. If you do not have an Azure Subscription directly connected to your Entra ID tenant, but can access an Azure Subscription in another tenant, please look into the description of [using Azure Lighthouse here](../../resources/resource-1-azure-lighthouse/readme.md).

If you don't have access to any Azure subscription at all, skip to the last part of this lab exercise, and create a privileged user account directly via Graph Explorer to the Provisioning API, similar to what you did in Lab 1 earlier.

## Lab 2.1 - Create an access package which can be requrested for internal users only

As access packages are an easy way to request access to multiple resources in one go, let's create an access package which:

- Is created within the 'ELDK 2026' catalog
- Provides access to two or more resources
- Can be requested by all members in your directory (excluding guests)
- Doesn't have an approval process
- Has a lifecycle configured to either expire after 6 months or runs an Access Review bi-annualy.

**NOTE:** Please make sure that the access package can be requested by end users as we will use this access package within the lifecycle workflows tasks.

Microsoft Learn source: [Entitlement Management - Access Package Create](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-create)

&nbsp;

## Lab 2.2 - Add the assignment of this access package to the pre-hire workflow as a task

Now the access package has been created successfully, let's make sure to add it to a lifecycle workflow which has been created in the previous lab. We do this to make sure that for new joiners the access request is already put into the system and they don't have to request it theirselves in their first work week.

For that edit the 'pre-hire' workflow and add 'request access to an access package' as a taks and select the previously created access package and make sure to **save** your edited workflow. Now run the workflow on demand and make sure that the access request is being made to the access package.

**NOTE**: If you have active sign-ins on the account which is targeted during the run on demand the 'Generate and send TAP' step will fail, therefore make sure that on this task you temporarily tick the 'Continue on errror' checkbox within the workflow.

&nbsp;

## Lab 2.3 - Create an access package with an auto assignment policy

Now you've seen that access packages are an easy way to request access to multiple resources in one go, let's create another access package which will auto-assign users to the access package which:

- Is created within the 'ELDK 2026' catalog
- Provides access to two or more resources (different resources than used in the previous access package)
- Can be requested by no one (administrator direct assignments only)
- Doesn't have an approval process
- Doesn't have a lifecycle configured

Once the access package is created, open the access package and add a new 'auto assignment policy' underneath policies. Scope the auto assignment policy to the department 'ELDK 2026'.

Microsoft Learn source: [Entitlement Management - Access Package Auto Assignment Policy](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy)

&nbsp;

## 2.4 Choice: deploy with Bicep or UI

Go to lab 2.4.1 if you want to deploy Logic Apps and Managed Identities with bicep code.
If you rather want to do this via the UI, go to lab 2.4.2

**NOTE:** If you don't have access to an Azure Subscription, paste and modify [privileged-user.json](../../resources/resource-2-scim-sample-payloads/privileged-user.json) directly into Graph Explorer for the Provisioning API, similar to Lab 1 above.

&nbsp;

### 2.4.1 - Deploy Logic App and Managed Identity with Bicep

If you rather want to deploy the Logic App and managed Identity via the user interface go to the next step in this lab. For the ones who rather deal with code, we have prepared a Bicep deployment, [main.bicep](../../resources/resource-3-bicep-custom-extensions/main.bicep), that creates two Logic Apps for Custom Extensions, one for Lifecycle Workflows and one for Access Package usage. Change all TODO references to match your environment, and deploy using guidelines documented in the [readme](../../resources/resource-3-bicep-custom-extensions/readme.md)

This Bicep deployment, in addition to the Logic App Workflows, also create an User Assigned Managed Identity, gives the UAMI Graph Permissions, and connects the UAMI to the Logic Apps.

**NOTE**: When creating a Logic App in a multi-tenant scenario, the Authorization Policy of the Logic App will point to the wrong tenant. Please change the TenantID to the Entra tenantID you are setting up the custom extensions for, and not for the Entra TenantID where the Azure Subscription resides in.

These Logic Apps can be used within the next excercises in this lab.

&nbsp;

### Lab 2.4.2 - Create an access package which is using a custom extension

In lots of sceanrios you want to add more advanced scenario's with low code to an access package or lifecycle workflow, for that you can use custom extensions. For the next lab create a custom extension for requesting a privileged account and create a new access package which uses the custom extension on the 'assignment granted' stage. To do this:

- Create a custom extension with Logic App for 'privileged account requests' in the 'ELDK 2026' catalog (or if you completed lab 2.4.1 successfully, use the pre-created logic apps).
- Create an accesss package for 'privileged account requests' in the 'ELDK 2026' catalog.
- The Access Package should not provide access to resources.
- Can be requested by all members in your directory (excluding guests and prefferaby a dynamic group which only contains enabled users with an employeeID).
- Doesn't have an approval process (prefferably it has, but for lab and testing purposes you can skip this step).
- Has no lifecycle or access review configured.
- Configure the custom extension created earlier to be triggered after the 'Assignment has been granted' stage.
- If you've skipped LAB 2.4.1. make sure to assign a system assigned managed identity to the logic app created within this lab.

Microsoft Learn source: [Entitlement Management - Custom Extension](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-logic-apps-integration)

&nbsp;

## Lab 2.5 - Edit Logic App with HTTP Requests for Getting User Details from Target and Build SCIM Payload

Since the logic app and custom extension have now been created but don't contain the low code steps, let's make sure to add these in. For that we have generated example source code which you can 'copy and paste' into the logic app which has been created via the UI or Bicep. The source code can be found at ............

Once the source code is copied in, open the designer in logic apps and make sure to change the following details:
- ObjectID Condition
- Change the UserID within the send email action
- Verify the HTML Body
- Verify the callback action and message

Once all the above steps are completed don't forget to hit **save** on the logic app and proceed to the next labb exercise.

&nbsp;

## Lab 2.6 - Provide the managed identity the right MSGraph permissions and Entra roles

To make sure that the managed identity has the right permissions within Microsoft Graph and Microsoft Entra we need to apply the following permissions:

| Target | Permissions or role | Reasoning |
| --- | --- | --- |
| Microsoft Graph | User.Read.All, Mail.Send, AuditLog.Read.All, SynchronizationData-User.Upload | Required to grab the user details, execute the API call against the Inbound Provisioning API and being able to send an email via a Microsoft Graph API call. |
| Microsoft Entra | Authentication Administrator, Access Package Assignment Administrator (on ELDK 2026 Catalog). | Required to generate the temporary access pass for a non-privileged user account and execute the API callback against the custom extension in Entitlement Management |

For the Microsoft Graph permissions the following script can be used: [Configure-MsGRaphPermissions.ps1](../../resources/resource-5-msgraph-permissions/Configure-MsGraphPermissions.ps1)
For the Microsoft Entra permissions the two roles need to be manually assigned.

Once you're ready, verify if the MS Graph permissions and roles have been configured successfully on the managed identity and continue to the next lab step.

&nbsp;

## Lab 2.7 - Test the Access Package by requesting access

Now the access package has been configured correctly lets verify if it's fully operational. This can be done by requesting the access package via [MyAccess](https://myaccess.microsoft.com) and make sure the entire process completes successfully and the callback of the custom extension is registered correctly.

&nbsp;

## Lab 2.8 - Enable the passkey authentication method

Now the onboarding has finished let's make sure that once the end user is starting to use their TAP they can onboard a passkey to their account. Within Entra ID go to Authentication Methods with an admin account which has the authentication policy administrator role. Here make sure that:

- There is passkey profile configured for all users whereby device-bound passkeys are enabled
- There is passkey profile configured for all users whereby synced passkeys are enabled, this can be targetted against a dynamic group containing all regular user accounts, or a test group.

Microsoft Learn source:  [Entra ID - Passkey Profiles](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-passkey-profiles)

&nbsp;

## Lab 2.9 - Sign-in with your privileged account and register a passkey

Now you've received a Temporary Access Pass in your regular email, sign-in with your newly generated privileged account and register a passkey underneath your account to make sure your privileged account becomes phishing resistant.
