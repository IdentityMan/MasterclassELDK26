# Bicep Templates for Multi-Tenant Extensions

The following will assist in deploying a Multi-Tenant setup for Custom Extensions for Lifecycle Workflows and Access Package Catalogs, using Bicep deployment templates for Multi-Tenant Apps, Managed Identities, Workload Identity Federation and Microsoft Graph API across multi-tenants. This deployment will also implement an Azure Function App that will act as a Token Broker using Managed Identities and Workload Identity Federation in a Multi-Tenant scenario where a Graph Token can be used by Custom Extensions using Logic Apps.

## Login to Azure Subscription

Login to an Azure subscription where you can create resources like Resource Groups, Logic Apps etc for the later labs, using Azure CLI.

```azurecli
az login --tenant yourtenant.onmicrosoft.com
```

After logging in, confirm the right subscription. If you need to verify or change between Azure subscriptions, run:

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
