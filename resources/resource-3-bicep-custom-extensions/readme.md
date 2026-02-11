# Bicep Templates for Custom Extensions

The following will assist in deploying Custom Extensions for Lifecycle Workflows and Access Package Catalogs, using Bicep deployment templates for Logic Apps, Managed Identities and Microsoft Graph API.

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

In the main.bicep file, change all relevant parameters to reflect your environment and choice of naming.

## Deploy Bicep

Deploy the main.bicep file with one of the following commands, changing the deployment names and location as needed.

Deploy as Subscription Deployment:

```azurecli
az deployment sub create --name 'deploy-sub-yourorg-iam-custom-extensions' --location norwayeast --template-file main.bicep
```

Deploy as Deployment Stack is *NOT* supported when using the Microsoft Graph API extension.
