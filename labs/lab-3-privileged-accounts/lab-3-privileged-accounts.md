# Lab 3 - Securing Privileged Accounts

## Lab 3.1 - Enable the passkey authentication method

Now the onboarding has finished let's make sure that once the end user is starting to use their TAP they can onboard a passkey to their account. Within Entra ID go to Authentication Methods with an admin account which has the authentication policy administrator role. Here make sure that:

- There is passkey profile configured for all users whereby device-bound passkeys are enabled
- There is passkey profile configured for all users whereby synced passkeys are enabled, this can be targetted against a dynamic group containing all regular user accounts, or a test group.

Microsoft Learn source: [Entra ID - Passkey Profiles](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-passkey-profiles)

&nbsp;

## Lab 3.2 - Sign-in with your privileged account and register a passkey

Now you've received a Temporary Access Pass in your regular email, sign-in with your newly generated privileged account and register a passkey underneath your account to make sure your privileged account becomes phishing resistant.

&nbsp;

## Lab 3.3 - Link privileged account to identity in Microsoft Defender XDR

Create a manual link between the privileged user and the regular (work) account of the identity:

1. Navigate to [Identity inventory](https://security.microsoft.com/identity-inventory) in Microsoft Defender XDR.
2. Select or search for the created privileged account.
3. Click on the tab "Observed in organization" and link the privileged account to the regular (workforce) account of the identity.

More details are available in [Microsoft Learn](https://learn.microsoft.com/en-us/defender-for-identity/link-unlink-account-to-identity#how-to-manually-link-or-unlink-accounts-to-an-identity).

After the link has been created, navigate to the identity page of the work account.

&nbsp;

## Lab 3.4 - Assign privileged account to Restricted Management Administrative Unit (RMAU)

1. Create an [Administrative Unit with dynamic membership](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-members-dynamic?tabs=admin-center#add-rules-for-dynamic-membership-groups) named “Privileged Users” and enable “[Restricted management administrative unit](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/admin-units-restricted-management)” during the creation process.

2. Configure a rule depending on your naming convention for privileged users or other unique attributes (e.g., domain suffix for cloud-only accounts).

    > 💡 **Optional**  
    > Evaluate the option to configure [dynamic membership with the memberOf attribute](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-rule-member-of). This allows you to assign members of role-assignable groups or other privileged groups to RMAU automatically. Consider that this feature is in preview and take note of the warning about limitations from the [Microsoft Learn](https://learn.microsoft.com/en-us/entra/identity/users/groups-dynamic-rule-member-of) documentation.

3. Assign a role [on the scope of the Administrative Unit](https://learn.microsoft.com/en-us/entra/identity/role-based-access-control/manage-roles-portal?tabs=admin-center#assign-roles-with-administrative-unit-scope-1) to regain access for managing privileged users. Choose a dedicated role-assignable group which will be used for Control Plane Management.
