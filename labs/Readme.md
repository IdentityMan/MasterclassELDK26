# Lab Instructions - Identity Master Class

Read these instructions to prepare for the Identity Master Class at Experts Live Denmark 2026.

## Bring Your Own Tenant

We won't be able to give the attendees tenants or give the attendees access to the speakers own demo tenants at this scale, so to be able to do the hands-on labs you need to bring your own tenant.

There are several options for bringing your own tenant, these are the most common ones:

- Own Company Dev/Test environments
- Microsoft Demo eXperiences
- Microsoft 365 Developer Program Subscription
- Create a Trial Subscription

Detailed instructions in the next sub-sections:

### Onw Company Dev/Test environments

If you are part of a Company or Organization and have a work account, you can use that as a starting point for your own lab environment. We do not recommend using your production tenant for following the labs, so you should either have access to a test/dev/demo tenant or have the opportunity to create another tenant.

To create another tenant using your work account, follow the instructions here: <https://learn.microsoft.com/nb-no/entra/fundamentals/create-new-tenant>. You will need to be assigned the role of Tenant Creator to create a new tenant, or work with your Global Administrator to do this.

### Microsoft Demo eXperiences

If you are a Microsoft Partner enrolled in the Partner Network or an Microsoft Employee, you can use the Microsoft Demo exPeriences portal <https://cdx.transform.microsoft.com/> to create a tenant using the "Microsoft 365 Enterprise Demo Content Pack". PS! There are limitations to how many tenants you can have in total, where the current limitations are:

Microsoft Users:
- One Year tenants: 2
- 90-Day tenants: 3

Partner Users:
- 90-day tenants: 1

Partner users can only have one tenant simultaneously, so you might have to delete any existing expired tenants before you can create a new one.

### Microsoft 365 Developer Program Subscription

If you are eligble you can sign up for the Microsoft 365 Developer Program, <https://developer.microsoft.com/en-us/microsoft-365/dev-program>, and create a Microsoft 365 E5 Developer Subscription.

To see eligble programs like "Microsoft AI Cloud Partner Program Participants", "Visual Studio Subscribers" etc, look here: <https://learn.microsoft.com/en-us/office/developer-program/microsoft-365-developer-program>

When you sign up you can get the option to create a tenant for the Microsoft 365 E5 Developer Sandbox Subscription.

### Create a Trial Subscription

If the above options don't work, you can create a Trial Subscription. These options are free for the trial period, but must be guaranteed by a credit card as the services are converted to Pay as you go after trial period ends.

Here are a couple of options for creating a Trial tenant and subscription:

- **Azure Trial**.
  - You can sign up for an Azure free account (one time only) or a Pay as you go account. Both options include a lot of free services, and the one-time Azure free account also include $200 in credit for the first month. <https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account>
  - If you are a Student you can sign up for Azure for Students for free using your school e-mail account, <https://azure.microsoft.com/en-us/free/students>
  - PS! Using your Work or School account for the above will connect you to your Organization tenant, so that will limit your ability to use this for test and demo purposes. You can instead sign up for Azure Trial using a personal Microsoft account or create a new account.
- **Microsoft 365 Business Trial**.
  - You can create a Microsoft 365 Business Trial by creating a new account, <https://www.microsoft.com/en-us/microsoft-365/business/microsoft-365-business-standard-one-month-trial>.
  - If you already have Microsoft 365 in your Organization, don't use your Work account for this.

## What Licenses do you need?

As the Identity Master Class of course focuses on Microsoft Entra, you will need licenses in addition to Entra Free to follow the lab instructions yourself.

Depending on what kind of Tenant you have been able to set up yourself from above scenarios, here are some guidelines for activating trials of Entra license plans:

- Entra Suite Trial
  - Entra Suite Trial can give you up to 90 days trial for 25 users in your tenant.
  - Requires minimum Entra ID P1 in the tenant first. See trial user guide: <https://learn.microsoft.com/en-us/entra/fundamentals/try-microsoft-entra-suite>
  - Activate trial in the Entra Admin Portal: <https://entra.microsoft.com/#view/Microsoft_AAD_IAM/TryBuyProductBlade/>
  - If you are using the Microsoft Demo eXperiences (MDX), you can activate Entra Suite as an add-on content pack.
- Entra ID Governance Trial
  - 25 licenses for 30 days, requires Entra ID P1 or P2 in your tenant.
  - Activate in Entra Admin Portal or see more at: <https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id-governance>
- Entra ID P2 Trial
  - 100 licenses for 30 days.
  - Activate trial in the Entra Admin Portal: <https://entra.microsoft.com/#view/Microsoft_AAD_IAM/TryBuyProductBlade/>

## What Privilege do I need?

While we will for each lab instruction provide details on a least-privilege role permission for the task, but you can expect that some tasks will require up to Global Administrator in the Demo Tenant, or at least access to a person that is GA and can do the task for you. Typically these are Admin Consents and like.
We strongly recommend using a member account in the test or lab tenant for testing scenarios to avoid the limitations of B2B users and reduces complexity by potential cross-tenant scenarios..
## Do I need any installed software?
For a few lab scenarios, you will need to execute and install `Maester` module. Therefore, ensure that you have the latest version of PowerShell Core installed. Make sure these prerequisites are met. No local administrative privileges are required.

## Do I need an Azure Subscription?

Yes, some labs require access to an Azure Subscription, but these labs can also be skipped or done later, and will not be a requirement for the later labs in the class.

If you can bring your own Azure Subscription, we recommend one of the following setups:

1. If using your own company work account and demo environment, contact your administrator and see if you can get a test/dev Azure Subscription by your company, or..
2. Create an Azure Trial Subscription by using the instructions above.

You will probably find you in a situation where you have a separate demo tenant (CDX, M365 Developer, etc), and the Azure Subscription connected to your Organization tenant. While you can reassociate Azure Subscriptions to other tenants, we recommend deploying Azure Lighthouse delegation instead for giving access to Azure between tenants.

```azurecli
# We will provide a sample deployment script here for using Azure Lighthouse before the event..
```

## What if I am not able to bring your own tenant to the Identity Master Class?

You will be able to bring the labs home and do them at a later time. We will strongly encourage attendees to work together with your side-person on the day, so that you can collaborate on the labs if you don't have access yourself.
