# Lab 1 - Inbound Provisioning API

In this first lab you will create an Inbound API-drive Provisioning App in your Tenant, customize attribute mappings and schema, and learn how to post SCIM payloads to create and update users in your tenant.

&nbsp;

## Lab 1.1 - Create new API-driven Inbound Provisioning App in Entra ID

In the Microsoft Entra portal, go to Enterprise Apps and click "+ New application". From the Microsoft Entra App gallery, search for "API-driven provisioning" and you should see two options:

- API-driven provisioning to Microsoft Entra ID
- API-driven provisioning to on-premises Active Directory

Click to select "API-driven provisioning to Microsoft Entra ID", give it a descriptive name like "ELDK26 API-driven provisioning to Entra ID" and click Create.

After the application is created, under Manage, click on Provisioning. Notice the different selections under "Get started", but we will start by clicking "+ New configuration" at the top. At the blade for "New provisioning configuration", select Create. After the provisioning configuration has been created, notice the Basic information and make a note of these for later:

- Service principal object id
- Job ID

&nbsp;

## Lab 1.2 - Attribute Mappings

Mapping attributes is an important part of inbound provisioning, where you will match your incoming data, like from an HR system or a custom source, to the attributes in Entra ID.

Under Attribute mapping, click on the name "Provision API urn:ietf:params:scim:schemas:extension:enterprise:2.0:Users". Verify that the mappings are enabled, that Source Object Scope is All records, and Target Object Actions are Create, Update and Delete.

When you create a new API-driven provisioning app a set of default attribute mappings is created. We will now make some extra mappings.

First, note that the attribute in Entra ID, **employeeId**, is by default mapped to API attribute **externalId**, and with a Matching precedence of 1. This means that this attribute will be used for matching existing users in Entra ID with new users provisioned via the API. Normally this will be the Employee ID from your HR system, or you need to maintain separate unique ID's from your custom source.

We will now add some more attributes, click Add New Mapping and add these:

Attribute mappings to create:

| Entra ID Attribute | API Attribute |
| --- | --- |
| companyName | urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:organization |
| employeeOrgData.costCenter | urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:costCenter |
| employeeOrgData.division | urn:ietf:params:scim:schemas:extension:enterprise:2.0:User:division |
| employeeType | userType |

Note that when you add or edit mappings, you can also choose between Direct mappings, constants and expression based. 

Remember to click Save to store your new attribute mappings.

&nbsp;

## Lab 1.3 - Edit Attribute List and Add Schema

You can even customize the schema beyond the default attributes in the API. This is needed to be able to get employee hire dates and leave dates.

Click on "Show advanced options", and the click "Edit attribute list for API". Here you can add or change the list of API attributes. Scroll down, and there is an empty name box. You can define your own Schema, so lets add the 2 following attributes (add as strings even though they are dates), change yourorgnamehere to your companyname, or use eldk26 or something similar:

- urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:HireDate
- urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:LeaveDate

Save and Refresh App.

You can now add more Attribute mappings:

| Entra ID Attribute | API Attribute |
| --- | --- |
| employeeHireDate | urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:HireDate |
| employeeLeaveDateTime | urn:ietf:params:scim:schemas:extension:yourorgnamehere:1.0:User:LeaveDate |

Remember to click Save to store your new attribute mappings.

&nbsp;

## Lab 1.4 - Enable Provisioning & Prepare to Send SCIM payload via Graph Explorer

First we need to start provisioning, go to the Provisioning blade and under Settings make sure that Provisioning Status is set to **On**.

After enabling provisioning, the API is ready to receive inbound requests. Go to the Overview page, this is where you had the Basic information earlier in the lab. Note that you now should have a "Provisioning API endpoint". This is a Microsoft Graph API endpoint, that will be in this format:

https://graph.microsoft.com/v1.0/servicePrincipals/(service-principal-object-id)/synchronization/jobs/(Job-ID)/bulkUpload

1. Copy the Provisioning API endpoint URI.
2. Go to Microsoft Graph Explorer, https://aka.ms/ge. Sign in with your Global Administrator account, consenting to Graph permissions as needed.
3. After signing in, change HTTP request method to **POST**, and the paste in the Provisioning API endpoint URI you copied in the address field.
4. Go to Modify permissions. You should now see that you need to consent to the permission **SynchronizationData-User.Upload**. Click to Consent this permission for "Bulk upload user data to identity synchronization service", which allows the app to upload bulk user data to the identity synchronization service, on your behalf.

We are now ready to send user provisioning data.

&nbsp;

## Lab 1.5 - Send minimum SCIM payload to create a user

In Graph Explorer, go to Request Headers, and add the following key-value pair to the Headers:

Content-Type: application/scim+json

Under Request Body, paste in a minimum SCIM payload from the Resources folder here: [minimum-user.json](../../resources/resource-2-scim-sample-payloads/minimum-user.json). The minimum payload is just enough to provision a new user.

BulkId is just a unique id for this bulk operation, you can safely use the provided one, or generate a new one. You can also change the externalId or user name if you like.

Click **Run query**, and if successful you should get an HTTP response of 202 - Accepted.

After a few minutes, you can check in the Entra portal if the user has been created. After 5-10 minutes, on the Provisioning App, check the Provisioning Logs, and you should see a successful Create operation. Click the details of the log entry to verify the steps, modified properties and summary. Note that the user action is "create", since the externalId mapped to the employeeId property has not been used from before.

&nbsp;

## Lab 1.6 - Send full SCIM payload to update a user

Still in Graph Explorer, under Request Body, paste in a full SCIM payload from the Resources folder here: [full-user.json](../../resources/resource-2-scim-sample-payloads/full-user.json). The full payload includes many more mappings, including the custom mappings you created earlier in the lab.

The full user payload also include a Manager reference to set the User's Manager. Please note that to specify a Manager, you will need to either:

1. Include the Manager user object in the SCIM payload, and refer to the externalId as shown in the sample, or..
2. Refer to the externalId of a Manager that has *previously* been provisioned via the same Provisioning API.

Click **Run query**, and if successful you should get an HTTP response of 202 - Accepted.

Again after a few minutes, check in the Entra portal if the user has updated. After 5-10 minutes, on the Provisioning App, check the Provisioning Logs, and you should see a successful Update operation. 

&nbsp;

## Lab 1.7 - Check Provisioning Audit Logs via Graph API

When working with Inbound Provisioning you will from time to time need to explore the provisioning audit logs, which also can be done via Graph API.

The URI to send GET requests for provisioning logs is "https://graph.microsoft.com/v1.0/auditLogs/provisioning/?$filter=jobid eq '(Job-ID)'"

The Job ID is the same as above from setting up the Inbound API-driven provisioning app.

You will need to Consent to "ProvisioningLog.Read.All" permission to explore the above provisioning logs.

Paste your Job ID to the URI above and Run Query in Graph Explorer, and verify that you can see the same entries as in the Provisioning Logs from the Inbound Provisioning App in Entra ID.

&nbsp;

## Lab 1.8 - Create an App Registration for an Inbound Provisioning Application Client

In this lab you used Graph Explorer for submitting a SCIM payload to the Inbound Provisioning App, using a Delegated user scenario. Other first party applications like Microsoft Graph PowerShell SDK can also be used to send SCIM requests to the bulk upload endpoint.

If you want to build and integrate your own solutions, you need to create an App Registration in your Entra ID tenant, and give the application the necessary Graph API permissions to either act on behalf of the signed-in user (Delegated) or as itself (Application).

In this lab exercise we will set up the latter.

1. In Entra ID, under App Registrations, create a "+ New Registration".
2. Give the App a name like for example "API-driven provisioning to Microsoft Entra ID - ELDK Client"
3. Leave the other settings as default, including Single-Tenant App.
4. Under API permissions, add the following Microsoft Graph **Application** permissions:
    1. ProvisioningLog.Read.All
    1. SynchronizationData-User.Upload
5. Grant Admin Consent for the Application Permissions.
6. Under "Certificates & secrets", create a new short-lived Client Secret, and copy the Secret value for later.
7. On the Overview Page, copy the Client ID and Tenant ID for later.

Using a Client Credential OAuth2 flow, you can now use this Application Client to send Inbound Provisioning SCIM Payloads to the BulkUpload endpoint from above.

&nbsp;

## Lab 1.9 - Create pre-hire workflow

Now first create a pre-hire workflow in lifecycle workflows and scope the pre-hire workflow to be executed for users with the department 'ELDK 2026' 7 days prior to the employeeHireDate. Within this workflow make sure the following actions are set:

- Generate TAP and Send Email to manager
- Assign at least a mailbox license to the end user

Microsoft Learn source: [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

&nbsp;

## Lab 1.10 - Create new hire workflow

After the pre-hire workflow has been created, create a new-hire workflow which is triggered based on the employeeHireDate and scoped to users with the departmet 'ELDK 2026'. Within this workflow make sure the following tasks are set:

- Enable Account
- Send Welcome email (feel free to customize on your own)
- Make the user a member of a security group for ELDK 2026
- Make the user a member of a MS Teams group for ELDK 2026

Microsoft Learn source:  [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

&nbsp;

## Lab 1.11 - Create post-onboarding workflow

At last, create a post-onboarding workflow which is scoped to users with the department 'ELDK 2026' 7 days after the employeeHireDate. Within this workflow make sure the following tasks are executed:

- Send onboarding reminder email to manager

Microsoft Learn source:  [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

&nbsp;

## Lab 1.12 - Run the workflows one-by-one

Make sure that all tasks are exectued successfully.&nbsp;
**NOTE:** Be aware that for some tasks the manager need to be configured on the user account and both should have a mailbox assigned.&nbsp;
**NOTE:** Be aware that the Temporary Access Pass authentication method should be configured within your tenant to generate the Temporary Access Pass./

Microsoft Learn source:  [Lifecycle Workflows - Run on Demand](https://learn.microsoft.com/en-us/entra/id-governance/on-demand-workflow)

&nbsp;

## Lab 1.13 - Onboard the user with their TAP and register for MFA

If you've succesfully completed all the earlier steps in this lab you should be able to onboard the end user account by:

- Retrieving the Temporary Access Pass from the mailbox of the manager
- Sign-in with the user via a web-browser and enroll for MFA via [My Sign-ins](https://mysignins.microsoft.com/security-info)

&nbsp;

## Lab 1.14 - (OPTIONAL) Send SCIM Payload via Postman

This lab utilises the above Application Client scenario, and submits a SCIM payload using the Postman client. As this lab is optional, the steps below are provided on a high overview level, and you can use any other preferred REST API client instead of Postman if you like. 

PS! Make sure not to expose the Client Credentials to third parties via profile settings or synchronizations.

1. In Postman, create an Environment with the following variables (local and sensitive as preferred):
    1. inbound-provisioning-service-principal-id = "Your Inbound Provisioning App Service Principal as from above"
    1. inbound-provisioning-job-id = "Your Job ID from Inbound Provisioning App as from above"
    1. token-endpoint = "https://login.microsoftonline.com/(your-tenant-id)/oauth2/v2.0/token"
    1. inbound-provisioning-client-id = "(your-client-id-from-app-registration-above)"
    1. inbound-provisioning-client-secret = "(your-client-secret-from-app-registration-above)"
2. Create a Collection for your requests
    1. On the Properties of the Collection, select Authorization and OAuth2 as Auth Type, and add auth data to Request Headers.
    1. Under Configure a New Token, give it a descriptive name.
    1. Select Grant Type = Client Credentials
    1. Access Token URL = {{token-endpoint}}
    1. Client ID = {{inbound-provisioning-client-id}}
    1. Client Secret = {{inbound-provisioning-client-secret}}
    1. Scope = .default
    1. Client Authentication = Send client credentials in body
3. Click to **Get a New Access Token**, which if above configured correctly will return an Access Token you can use.
4. You can now, under the Collection, create Requests that will inherit the Authorization settings from the above Collection. Create the following:
    1. POST https://graph.microsoft.com/v1.0/servicePrincipals/{{inbound-provisioning-service-principal-id}}/synchronization/jobs/{{inbound-provisioning-job-id}}/bulkUpload
    1. Set the Content-Type header to application/scim+json
    1. Try one of the minimum or full SCIM json payloads from above, or create/modify your own.
    1. Try GET https://graph.microsoft.com/beta/auditLogs/provisioning/?$filter=jobid eq '{{inbound-provisioning-job-id}}', to get the the Provisioning Logs.

&nbsp;

## Lab 1.15 - (OPTIONAL) Create a custom extension for lifecycle workflows

In some cases you perhaps want to add more advanced scenario's with low code to a lifecycle workflow, for that you can use custom extensions. If you've got time left during the lab you can create a custom extension which can be used within one of the lifecycle workflows created earlier. To do this:

- Create a custom extension within Lifecycle Workflows
- Configure one of the workflows to run a custom task extension which is created earlier

Microsoft Learn source: [Lifecycle Workflows - Custom Task Extension](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-extensibility)

## Lab 1.16 - Summary & Discussion

To finish the lab, turn to your sideperson and discuss or reflect over the following questions.

1. What happens if you want to create another user, and submits a user payload object that uses the same externalId matching attribute as an existing user?
2. What happens if you submit a new user SCIM payload with a new unique externalId, but the username is already in use by another user in Entra ID? 
3. Why isn't the userPrincipalName submitted in the SCIM payload? How is it determined?
4. What happens if you want to onboard a user in lifecycle workflows with a 'Generate TAP' step while the user already has sign-ins on their account?
