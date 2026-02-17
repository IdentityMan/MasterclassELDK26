# Lab 2 - Entitlement Management

The activities in this lab will all be executed within the [Entitlement Management](https://entra.microsoft.com/#view/Microsoft_AAD_ERM/DashboardBlade/~/GettingStarted) & [Lifecycle Workflows](https://entra.microsoft.com/#view/Microsoft_AAD_LifecycleManagement/CommonMenuBlade/~/overview) blade in Entra ID. For this you need at a bear minimum 'Identity Governance Administrator' and 'Lifecycle Workflow Administrator'.

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
BLABLABLA

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

## Lab 2.4 - Create a custom extension for access packages

In some cases you perhaps want to add more advanced scenario's with low code to an access package, for that you can use custom extensions. For the next lab create a custom extension for requesting a privileged account and create a new access package which uses the custom extension on the 'assignment granted' stage. To do this:

- Create a custom extension for 'privileged account requests' in the 'ELDK 2026' catalog.
- Create an accesss package for 'privileged account requests' in the 'ELDK 2026' catalog.
- Provides access to no resources.
- Can be requested by all members in your directory (excluding guests and prefferaby a dynamic group which only contains enabled users with an employeeID).
- Doesn't have an approval process (prefferably it has, but for testing purposes we skip this step).
- Has no lifecycle or access review configured.
- Configure the custom extension created earlier to be triggered after the 'Assignment has been granted' stage.

Microsoft Learn source: [Entitlement Management - Custom Extension](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-logic-apps-integration)

&nbsp;

## Lab 2.5 - Enable the passkey authentication method

Now the onboarding has finished let's make sure that once the end user is starting to use their TAP they can onboard a passkey to their account. Within Entra ID go to Authentication Methods with an admin account which has the authentication policy administrator role. Here make sure that:

- There is passkey profile configured for all users whereby device-bound passkeys are enabled
- There is passkey profile configured for all users whereby synced passkeys are enabled, this can be targetted against a dynamic group containing all regular user accounts, or a test group.

Microsoft Learn source:  [Entra ID - Passkey Profiles](https://learn.microsoft.com/en-us/entra/identity/authentication/how-to-authentication-passkey-profiles)

&nbsp;
