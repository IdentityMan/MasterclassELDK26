# Lab 2 - Entitlement Management and Lifecycle Workflows

The activities in this lab will all be executed within the Lifecycle Workflows blade in Entra ID. For this you need at a bear minimum 'Lifecycle Workflow Administrator'.





## Lab 2.1 - Create pre-hire workflow

Now first create a pre-hire workflow in lifecycle workflows and scope the pre-hire workflow to be executed for users with the department 'ELDK 2026' 7 days prior to the employeeHireDate. Within this workflow make sure the following actions are set:
- Generate TAP and Send Email to manager
- Assign at least a mailbox license to the end user

## Lab 2.2 - Create new hire workflow

After the pre-hire workflow has been created, create a new-hire workflow which is triggered based on the employeeHireDate and scoped to users with the departmet 'ELDK 2026'. Within this workflow make sure the following tasks are set:
- Enable Account
- Send Welcome email (feel free to customize on your own)
- Create access package assignment?

## Lab 2.3 - Create post-onboarding workflow

At last, create a post-onboarding workflow which is scoped to users with the department 'ELDK 2026' 7 days after the employeeHireDate. Within this workflow make sure the following tasks are executed:
- Send onboarding reminder email to manager

## LAB 2.4 - run the workflows one-by-one

Make sure that all tasks are exectued successfully.\
**NOTE:** Be aware that for some tasks the manager need to be configured on the user account and should have a mailbox assigned.
