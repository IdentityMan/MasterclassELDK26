# Azure Lighthouse for Cross-Tenant Access to Azure Resources

The following will assist in accessing an Azure Subscription in another tenant than the Entra ID tenant you are working in.

This is especially useful where you are using Demo Resources tenants like CDX (Contoso tenant) or a Microsoft 365 Developer Sandbox tenant where you normally would have have direct access to an Azure subscription.

## Prepare your Entra tenant

In the Entra tenant where you will be working with labs and demo scenarios, take a note of the Tenant ID, and then create a Security Group where you add your admin account (and any other admin accounts needed), and take a note of the Group Obect ID.

## Login to Azure Subscription

Login to an Azure subscription where you can create resources like Resource Groups, Logic Apps etc for the later labs, using Azure CLI.

```azurecli
az login --tenant yourtenant.onmicrosoft.com
```

After logging in, confirm the right subscription. If you need to verify or change between Azure subscriptons, run:

```azurecli
az account show

az account set --subscription "your-subscription-name-or-id"
```

## TODO - Change Parameter values in Main Bicep file

In the main.bicep file, change all relevant parameters to reflect your environment and choice of naming. Add your Tenant ID and Group Object ID from above.

## Deploy Bicep

Deploy the main.bicep file with one of the following commands, changing the deployment names and location as needed.

Deploy as Subscription Deployment:

```azurecli
az deployment sub create --name 'deploy-sub-yourorg-iam-lighthouse' --location norwayeast --template-file main.bicep
```

Deploy as Deployment Stack:

```azurecli
az stack sub create --location NorwayEast --name "deploy-stack-yourorg-iam-lighthouse" --template-file .\main.bicep --deny-settings-mode none --action-on-unmanage deleteResources
```
