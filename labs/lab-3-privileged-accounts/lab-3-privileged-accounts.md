# Lab 3 - Privileged Accounts

## Lab 3.1 - Create separated accounts for privileged access by Identity Provisioning

TBD

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
