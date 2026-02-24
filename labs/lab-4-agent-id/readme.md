# Creating a custom agent with Agent ID

In this lab, you will create a custom agent using Microsoft Entra Agent ID. Agent ID allows you to create secure, identity-aware agents that can authenticate and interact with Microsoft Entra services.

## Prerequisites

Before you begin this lab, ensure you have the following prerequisites in place:

- Open API key from OpenAI with a $5 credit loaded. You can obtain this by signing up on the [OpenAI website](https://www.openai.com/) and creating an API key in your account settings.
- Node.js installed on your local machine. You can download it from [Node.js official website](https://nodejs.org/).

## Setting up Agent0

See the [Agent0 setup instructions](./agent-0/README.md) to create and configure your custom agent using Agent ID. This guide will walk you through the necessary steps to get your agent up and running.

### Create the Agent ID in Entra

To create an Agent ID in Microsoft Entra, follow these steps:

#### Install the Microsoft Entra PowerShell modules

- `Install-Module Microsoft.Entra.Beta.Authentication -Scope CurrentUser`
- `Install-Module Microsoft.Entra.Beta.Applications -Scope CurrentUser`

#### Connect to Microsoft Entra

- `Connect-Entra -Scopes Organization.Read.All, AgentIdentityBlueprint.Create, AgentIdentityBlueprintPrincipal.Create, AppRoleAssignment.ReadWrite.All, AgentIdentityBlueprint.ReadWrite.All, User.ReadWrite.All, AgentIdentityBlueprint.AddRemoveCreds.All`

#### Create the Agent ID

Run the following command to create an Agent ID:

```powershell
Invoke-EntraBetaAgentIdInteractive
```

This command will prompt you to provide the necessary information to create your Agent ID, such as the name and description of the agent. Follow the prompts to complete the creation process.

- `Enter a display name for the Agent Identity Blueprint (or press Enter for default):`
  - Press `Enter` to use the default name.
- `Use current user as sponsor?`
  - Press `Y` to use your current user account as the sponsor for the Agent ID.
- `Will there be interactive agents?`
  - Press 'y' since we will be creating an interactive agent in this lab.
- `Enter the admin consent description for the scope (press Enter for default):`
  - Press `Enter` to use the default values.
- `Enter the admin consent display name for the scope (press Enter for default):`
  - Press `Enter` to use the default values.
- `Enter the scope value (used in token claims, press Enter for default):`
  - Press `Enter` to use the default values.
- `Will this Agent Identity Blueprint have inheritable permissions?`
  - Press `y` since we want the permissions to be inheritable by agents created from this blueprint.
- `Enter permission scopes (comma-separated)`
  - Enter `User.Read` to grant the agent permission to read user profiles (this is just an example; you can specify other permissions as needed for your agent).
- `Will this Agent Identity Blueprint have Agent ID users?`
  - Enter `n` since we will not be creating Agent ID users in this lab.
- `Edit permission scopes (comma-separated, press Enter to use current):`
- IMPORTANT: Complete the admin consent process for the new Agent ID by following the instructions provided in the PowerShell output. This typically involves navigating to a specific URL and granting consent for the permissions requested by the Agent ID.
- After completing the admin consent process, return to the PowerShell prompt and confirm that the Agent ID has been successfully created.
- `Use example names for Agent Identities and Users?`
  - Press `y` to use example names for the Agent Identities and Users that will be created from this blueprint.

#### Create a client secret for local development

Since we will be running the agent locally, we need to create a client secret for authentication. Run the following command to create a client secret:

```powershell
Add-EntraBetaClientSecretToAgentIdentityBlueprint
```

Note the client secret value that is generated, as you will need to add it to your `.env` file for local development.

### Set up the Agent demo application

#### Create an app registration for the Agent demo single-page application

- Go to the Microsoft Entra admin center and navigate to "App registrations".
- Click on "New registration" and create a new app registration for the Agent demo frontend application
- Name: `Agent Demo Frontend`
- Supported account types: `Accounts in this organizational directory only`
- Redirect URI (single-page application): `http://localhost:8080`
- Click "Register" to create the app registration.

#### Create environment variables for the server

Create a `.env` file in the /agent-0/server directory with the following content:

```
# API Environment, local|test|prod
NODE_ENV=development

# Server Configuration
API_HOST=localhost
API_PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080


# Microsoft Entra ID Configuration
# Get these from your Agent Identity Blueprint app registration in Entra admin center
ENTRA_TENANT_ID='<your_tenant_id_here>'    # Directory (tenant) ID of your Entra tenant
ENTRA_CLIENT_ID='<your_agent_blueprint_id_here>'    # Application (client) ID of Agent Blueprint
ENTRA_AUDIENCE='api://<your_agent_blueprint_id_here>'  # Application ID URI from Expose an API

# Agent ID Configuration
# Agent Identity Blueprint (parent template)
AGENT_BLUEPRINT_ID='<your_agent_blueprint_id_here>'                    # Same as ENTRA_CLIENT_ID

# Agent Identity (child instance)
# Get this from the Graph API response when creating the Agent Identity
AGENT_IDENTITY_ID='<your_agent_identity_id_here>'                # Id of the Agent Identity

# Authentication Method
# For LOCAL DEVELOPMENT: Use client secret (not recommended for production)
USE_MANAGED_IDENTITY='false'
ENTRA_CLIENT_SECRET=''            # Client secret (for dev only!)

# Agent0 Configuration
OPENAI_API_KEY='<your_openai_api_key_here>'
```

#### Create environment variables for the client

Create a `.env` file in the /agent-0/ directory (note: Not in the /client directory) with the following content:

```
# API Environment, local|test|prod
NODE_ENV=development

# Server Configuration
API_HOST=localhost
API_PORT=3000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080

# Frontend Entra Configuration (prefix with VITE_ for Vite)
VITE_ENTRA_TENANT_ID='<your_tenant_id_here>'
VITE_ENTRA_CLIENT_ID='<your_spa_client_id_here>'    # Application (client) ID of the SPA app registration
VITE_ENTRA_API_SCOPE='api://<your_agent_blueprint_id_here>/access_agent_as_user'
```

#### Install dependencies and run the server

- Navigate to the `agent-0/server` directory in your terminal.
- Run `npm install` to install the necessary dependencies.
- Run `npm run dev` to start the server.

#### Install dependencies and run the client

- Open a new terminal window and navigate to the `agent-0/client` directory.
- Run `npm install` to install the necessary dependencies.
- Run `npm run dev` to start the development server for the frontend application.

#### Test the application

- Open your web browser and navigate to `http://localhost:8080`.
- Click the "Login" button to authenticate using Microsoft Entra ID.
- Ask the agent a question. Since we granted `User.Read` permissions to the agent, you can ask it to read your profile information, such as "What is my name?" or "What is my email address?" The agent should be able to retrieve this information using the Microsoft Graph API and respond accordingly.