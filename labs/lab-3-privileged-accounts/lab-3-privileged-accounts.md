# Lab 3 - Privileged Accounts

## Lab 3.1 - Create separated accounts for privileged access by Identity Provisioning

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

### 3.1.1 - Deploy Logic App and Managed Identity with Bicep

More code details coming, referring to ready [click-to-deploy template](../../resources/resource-3-bicep-custom-extensions/readme.md)

In the previous LAB you've create a custom extension with a new logic app for privileged accounts. Now to set permissions on this logic app the logic app needs a managed identity first. For that go to the logic app and enable a system-assigned managed identity. Once the system assigned managed identity is enabled, run this script [insert link] to assign the right MS Graph permissions to the managed identity.

Once you're ready, also make sure that the managed identity of the Logic App, has 'Access package assignment administrator privileges' on the 'ELDK 2026' catalog and the 'Authentication Administrator' role in Entra. The first role is required for the callback of the custom extension to actually be accepted. This is the least privilege solution, instead of providing MS Graph permissions to all access packages. The second role is required to generated a Temporary Access Pass for the newly generated privileged access accounts.

### 3.1.2 - Add Custom Extension to Entitlement Management Catalog

More details coming...

### 3.1.3 - Create Access Package for Privileged Access using Custom Extension

More details coming...

### 3.1.4 - Edit Logic App with HTTP Requests for Getting User Details from Target and Build SCIM Payload

Now the custom extension, access package, permissions and roles are set, it's time to predefine the logic app steps and make sure that the privileged account is actually created succesfully. For that copy the code which can be found here [insert link] into the code designer of the logic app and hit 'save' to activate the code. Once this is done the following actions are required to fine-tune the configuration:
- The right Inbound provisioning API endpoint needs to be defined in the logic app.
- Set the ObjectID value of your catalog in the logic app condtion
- Eventually customize the HTML email details.

### 3.1.5 - Add SCIM Payload and Send to Provisioning API

More details coming..., referring to [privileged-user.json](../../resources/resource-2-scim-sample-payloads/privileged-user.json)

### 3.1.6 - Test an Access Package assignment to Request a Privileged Account

More details coming...

PS! If you don't have access to an Azure Subscription, paste and modify [privileged-user.json](../../resources/resource-2-scim-sample-payloads/privileged-user.json) directly into Graph Explorer for the Provisioning API, similar to Lab 1 above.

## Lab 3.2 - Link privileged account to identity in Microsoft Defender XDR

Create a manual link between the privileged user and the regular (work) account of the identity:

1. Navigate to [Identity inventory](https://security.microsoft.com/identity-inventory) in Microsoft Defender XDR.
2. Select or search for the created privileged account.
3. Click on the tab "Observed in organization" and link the privileged account to the regular (workforce) account of the identity.

More details are available in [Microsoft Learn](https://learn.microsoft.com/en-us/defender-for-identity/link-unlink-account-to-identity#how-to-manually-link-or-unlink-accounts-to-an-identity).

After the link has been created, navigate to the identity page of the work account.

## Lab 3.3 - Assign privileged account to Restricted Management Administrative Unit (RMAU)

1. Create an [Administrative Unit with dynamic membership](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-members-dynamic?tabs=admin-center#add-rules-for-dynamic-membership-groups) named “Privileged Users” and enable “[Restricted management administrative unit](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-restricted-management)” during the creation process.

2. Configure a rule depending on your naming convention for privileged users or other unique attributes (e.g., domain suffix for cloud-only accounts).

    > 💡 **Optional**  
    > Evaluate the option to configure [dynamic membership with the memberOf attribute](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-rule-member-of). This allows you to assign members of role-assignable groups or other privileged groups to RMAU automatically. Consider that this feature is in preview and take note of the warning about limitations from the [Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-rule-member-of) documentation.

3. Assign a role [on the scope of the Administrative Unit](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/manage-roles-portal?tabs=admin-center#assign-roles-with-administrative-unit-scope-1) to regain access for managing privileged users. Choose a dedicated role-assignable group which will be used for Control Plane Management.
