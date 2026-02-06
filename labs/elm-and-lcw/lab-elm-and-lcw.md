# Lab 2 - Entitlement Management and Lifecycle Workflows

The activities in this lab will all be executed within the [Entitlement Management](https://entra.microsoft.com/#view/Microsoft_AAD_ERM/DashboardBlade/~/GettingStarted) & [Lifecycle Workflows](https://entra.microsoft.com/#view/Microsoft_AAD_LifecycleManagement/CommonMenuBlade/~/overview) blade in Entra ID. For this you need at a bear minimum 'Identity Governance Administrator' and 'Lifecycle Workflow Administrator'.

## Lab 2.1 - Create an access package which can be requrested for internal users only

As access packages are an easy way to request access to multiple resources in one go, let's create an access pacakge which:
- Is created within the 'ELDK 2026' catalog
- Provides access to two or more resources
- Can be requested by all members in your directory (excluding guests)
- Doesn't have an approval process
- Has a lifecycle configured to either expire after 6 months or runs an Access Review bi-annualy.

**NOTE:** Please make sure that the access package can be requested by end users as we will use this access pacakge within the lifecycle workflows tasks.

Microsoft Learn source: [Entitlement Management - Access Package Create](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-create)

## Lab 2.2 - Create an access package with an auto assignement policy

Now you've seen that access packages are an easy way to request access to multiple resources in one go, let's create another access package which will auto-assign users to the access package which:
- Is created within the 'ELDK 2026' catalog
- Provides access to two or more resources (different resources than used in the previous access package)
- Can be requested by no one (administrator direct assignments only)
- Doesn't have an approval process
- Doesn't have a lifecycle configured

Once the access package is created, open the access package and add a new 'auto assignmnet policy' underneath policies. Scope the auto assignment policy to the department 'ELDK 2026'.

Microsoft Learn source: [Entitlement Management - Access Package Auto Assignment Policy](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy)

## Lab 2.3 - Create pre-hire workflow

Now first create a pre-hire workflow in lifecycle workflows and scope the pre-hire workflow to be executed for users with the department 'ELDK 2026' 7 days prior to the employeeHireDate. Within this workflow make sure the following actions are set:
- Generate TAP and Send Email to manager
- Assign at least a mailbox license to the end user

Microsoft Learn source: [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

## Lab 2.4 - Create new hire workflow

After the pre-hire workflow has been created, create a new-hire workflow which is triggered based on the employeeHireDate and scoped to users with the departmet 'ELDK 2026'. Within this workflow make sure the following tasks are set:
- Enable Account
- Send Welcome email (feel free to customize on your own)
- Create access package assignment to the access package created in Lab 2.1

Microsoft Learn source:  [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

## Lab 2.5 - Create post-onboarding workflow

At last, create a post-onboarding workflow which is scoped to users with the department 'ELDK 2026' 7 days after the employeeHireDate. Within this workflow make sure the following tasks are executed:
- Send onboarding reminder email to manager

Microsoft Learn source:  [Lifecycle Workflows - Create](https://learn.microsoft.com/en-us/entra/id-governance/create-lifecycle-workflow)

## Lab 2.6 - Run the workflows one-by-one

Make sure that all tasks are exectued successfully.\
**NOTE:** Be aware that for some tasks the manager need to be configured on the user account and should have a mailbox assigned.

Microsoft Learn source:  [Lifecycle Workflows - Run on Demand](https://learn.microsoft.com/en-us/entra/id-governance/on-demand-workflow)

## Advanced Lab 2.7 - Create a custom extension for access pacakges

In some cases you perhaps want to add more advanced scenario's with low code to an access package, for that you can use custom extensions. If you've got time left during the lab you can create a custom extension which can be configured within one of the access packages created earlier. To do this:
- Create a custom extension in the 'ELDK 2026' catalog.
- Configure the custom extension in one of the access packages created earlier to be triggered after the 'Assignment has been granted'

Microsoft Learn source: [Entitlement Management - Custom Extension](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-logic-apps-integration)

## Advanced Lab 2.8 - Create a custom extension for lifecycle workflows

In some cases you perhaps want to add more advanced scenario's with low code to a lifecycle workflow, for that you can use custom extensions. If you've got time left during the lab you can create a custom extension which can be used within one of the lifecycle workflows created earlier. To do this:
- Create a custom extension within Lifecycle Workflows
- Configure one of the workflows to run a custom task extension which is created earlier

Microsoft Learn source: [Lifecycle Workflows - Custom Task Extension](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-extensibility)
