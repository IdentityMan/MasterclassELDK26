# Agent0

A full stack demo app showcasing **First Party Tool Calling for AI Agents** with Microsoft Entra Agent ID authentication.

> ⚠️ **Preview Notice**: This app uses Microsoft Entra Agent ID Platform, which is currently in **PUBLIC PREVIEW**. APIs and features may change before general availability.

![Agent0](/docs/agent0.png "Agent0 Logo")

## What is Agent0?

Agent0 demonstrates how to build an AI-powered chat application that can securely call APIs on behalf of the logged-in user using the new **Entra Agent ID** identity model. It uses:

- **Microsoft Entra Agent ID** for authentication (Agent Identity Blueprint + Agent Identity)
- **Two-stage OBO flow** for the AI agent to call Microsoft Graph
- **Managed Identity** for secure credential management (production)
- **OpenAI GPT-4** for AI capabilities
- **React + Vite** for the frontend
- **Fastify** for the backend API

Follow [this link](/docs/agent0.md) to learn more about Agent0's architecture.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React SPA     │  Tc     │  Fastify API    │  OBO    │ Microsoft Graph │
│  (Agent0 SPA)   │────────▶│  (Agent0 API)   │────────▶│    /v1.0/me     │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │ login                     │ validates JWT + Agent ID claims
        ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Microsoft Entra ID                                │
│                                                                          │
│  ┌─────────────────────┐       ┌─────────────────────┐                  │
│  │ Agent Identity      │       │   Agent Identity    │                  │
│  │ Blueprint           │──────▶│   (Child Instance)  │                  │
│  │ (Parent Template)   │       │                     │                  │
│  │                     │       │   Performs OBO on   │                  │
│  │ • Defines scopes    │       │   behalf of users   │                  │
│  │ • Holds credentials │       │                     │                  │
│  └─────────────────────┘       └─────────────────────┘                  │
│            │                                                             │
│            │ credentials (one of):                                       │
│            ├── Client Secret (dev only)                                  │
│            ├── Certificate                                               │
│            └── Federated Identity Credential ──▶ Managed Identity (prod) │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Agent ID Two-Stage Token Exchange Flow

Unlike traditional OBO, Agent ID uses a **two-stage token exchange**:

```
┌─────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌───────┐
│   User  │      │     SPA     │      │   API/Agent │      │  Entra ID   │      │ Graph │
└────┬────┘      └──────┬──────┘      └──────┬──────┘      └──────┬──────┘      └───┬───┘
     │                  │                    │                    │                 │
     │ 1. Login         │                    │                    │                 │
     │─────────────────▶│                    │                    │                 │
     │                  │ 2. Get token (Tc)  │                    │                 │
     │                  │   aud=Blueprint    │                    │                 │
     │                  │───────────────────▶│                    │                 │
     │                  │◀───────────────────│                    │                 │
     │                  │                    │                    │                 │
     │                  │ 3. Call API (Tc)   │                    │                 │
     │                  │───────────────────▶│                    │                 │
     │                  │                    │                    │                 │
     │                  │                    │ 4. STAGE 1:        │                 │
     │                  │                    │    client_creds +  │                 │
     │                  │                    │    client_secret + │                 │
     │                  │                    │    fmi_path        │                 │
     │                  │                    │───────────────────▶│                 │
     │                  │                    │◀───────────────────│                 │
     │                  │                    │    T1 (exchange)   │                 │
     │                  │                    │                    │                 │
     │                  │                    │ 5. STAGE 2:        │                 │
     │                  │                    │    OBO grant +     │                 │
     │                  │                    │    T1 as assertion │                 │
     │                  │                    │    + Tc            │                 │
     │                  │                    │───────────────────▶│                 │
     │                  │                    │◀───────────────────│                 │
     │                  │                    │    Graph token     │                 │
     │                  │                    │                    │                 │
     │                  │                    │ 6. Call Graph      │                 │
     │                  │                    │────────────────────────────────────▶│
     │                  │                    │◀────────────────────────────────────│
     │                  │                    │    User data       │                 │
     │                  │◀───────────────────│                    │                 │
     │◀─────────────────│                    │                    │                 │
     │                  │                    │                    │                 │
```

#### Stage 1: Get Exchange Token (T1)

The API authenticates the **Agent Blueprint** to get an exchange token for the **Agent Identity**:

```http
POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={agent-blueprint-id}
&client_secret={secret}              # or client_assertion for MSI/cert
&scope=api://AzureADTokenExchange/.default
&grant_type=client_credentials
&fmi_path={agent-identity-id}        # Target Agent Identity
```

#### Stage 2: OBO with Exchange Token

The API uses T1 to perform OBO and get the downstream resource token:

```http
POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

client_id={agent-identity-id}
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={T1}               # Exchange token from Stage 1
&assertion={Tc}                      # User's token from SPA
&scope=https://graph.microsoft.com/User.Read
&grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&requested_token_use=on_behalf_of
```

## Pre-requisites

- [Microsoft Entra ID tenant](https://entra.microsoft.com)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- Node.js version 22+
- PowerShell 7+ (for automated setup) or access to Entra admin center

## Entra Agent ID Configuration

You need to create the following resources in Microsoft Entra ID:

1. **Agent Identity Blueprint** - Parent template that defines the agent's capabilities
2. **Agent Identity Blueprint Principal** - Service principal for the Blueprint
3. **Agent Identity** - Child instance that performs actions on behalf of users
4. **Agent0 SPA** - Frontend single-page application
5. **User-Assigned Managed Identity** (optional, for production)

### Option 1: PowerShell Script (Automated)

Run these commands in PowerShell to create the Agent ID resources using direct Graph API calls:

```powershell
# Install Microsoft Graph PowerShell module if not already installed
Install-Module Microsoft.Graph -Scope CurrentUser -Force

# Connect to Microsoft Graph with required permissions
Connect-MgGraph -Scopes "Application.ReadWrite.All", "DelegatedPermissionGrant.ReadWrite.All"

# Get your tenant ID
$tenantId = (Get-MgContext).TenantId
Write-Host "Tenant ID: $tenantId"

# ============================================
# Step 1: Create the Agent Identity Blueprint
# ============================================

# Generate a unique scope ID
$scopeId = [Guid]::NewGuid().ToString()

# Create the Agent Identity Blueprint (application)
$blueprintBody = @{
    displayName = "Agent0 Blueprint"
    signInAudience = "AzureADMyOrg"
    api = @{
        oauth2PermissionScopes = @(
            @{
                id = $scopeId
                adminConsentDescription = "Allows the app to access Agent0 API on behalf of the signed-in user"
                adminConsentDisplayName = "Access Agent0 API"
                isEnabled = $true
                type = "User"
                value = "access_as_user"
                userConsentDescription = "Allow the app to access Agent0 API on your behalf"
                userConsentDisplayName = "Access Agent0 API"
            }
        )
    }
} | ConvertTo-Json -Depth 10

$blueprint = Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/applications/microsoft.graph.agentIdentityBlueprint" `
    -Body $blueprintBody `
    -ContentType "application/json"

Write-Host ""
Write-Host "=== Agent Identity Blueprint Created ===" -ForegroundColor Green
Write-Host "Application ID: $($blueprint.appId)"
Write-Host "Object ID: $($blueprint.id)"

# Set the Application ID URI
$identifierUriBody = @{
    identifierUris = @("api://$($blueprint.appId)")
} | ConvertTo-Json

Invoke-MgGraphRequest -Method PATCH `
    -Uri "https://graph.microsoft.com/beta/applications/$($blueprint.id)" `
    -Body $identifierUriBody `
    -ContentType "application/json"

Write-Host "Application ID URI set to: api://$($blueprint.appId)"

# Add Microsoft Graph User.Read delegated permission to Blueprint
$graphAppId = "00000003-0000-0000-c000-000000000000"
$userReadScopeId = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"

$requiredResourceAccessBody = @{
    requiredResourceAccess = @(
        @{
            resourceAppId = $graphAppId
            resourceAccess = @(
                @{
                    id = $userReadScopeId
                    type = "Scope"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-MgGraphRequest -Method PATCH `
    -Uri "https://graph.microsoft.com/beta/applications/$($blueprint.id)" `
    -Body $requiredResourceAccessBody `
    -ContentType "application/json"

Write-Host "Added Microsoft Graph User.Read permission to Blueprint"

# ============================================
# Step 2: Create Agent Identity Blueprint Principal
# ============================================

$blueprintPrincipalBody = @{
    appId = $blueprint.appId
} | ConvertTo-Json

$blueprintPrincipal = Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/servicePrincipals/microsoft.graph.agentIdentityBlueprintPrincipal" `
    -Body $blueprintPrincipalBody `
    -ContentType "application/json"

Write-Host ""
Write-Host "=== Agent Identity Blueprint Principal Created ===" -ForegroundColor Green
Write-Host "Service Principal ID: $($blueprintPrincipal.id)"

# ============================================
# Step 3: Create Agent Identity (Child)
# ============================================

$agentIdentityBody = @{
    displayName = "Agent0 Identity"
    agentIdentityBlueprintId = $blueprint.appId
} | ConvertTo-Json

$agentIdentity = Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/servicePrincipals/microsoft.graph.agentIdentity" `
    -Body $agentIdentityBody `
    -ContentType "application/json"

Write-Host ""
Write-Host "=== Agent Identity Created ===" -ForegroundColor Green
Write-Host "Agent Identity ID: $($agentIdentity.appId)"
Write-Host "Agent Identity Object ID: $($agentIdentity.id)"

# ============================================
# Step 4: Create Client Secret (for local development only)
# ============================================

Write-Host ""
Write-Host "=== Creating Client Secret (for local development) ===" -ForegroundColor Yellow
Write-Host "⚠️  WARNING: Client secrets are for LOCAL DEVELOPMENT ONLY!" -ForegroundColor Yellow
Write-Host "⚠️  In production, use Managed Identity with Federated Identity Credentials" -ForegroundColor Yellow

$secretBody = @{
    passwordCredential = @{
        displayName = "Agent0 Dev Secret"
        endDateTime = (Get-Date).AddYears(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 5

$secret = Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/applications/$($blueprint.id)/addPassword" `
    -Body $secretBody `
    -ContentType "application/json"

Write-Host "Client Secret: $($secret.secretText)" -ForegroundColor Yellow
Write-Host "⚠️  Save this secret now - it won't be shown again!" -ForegroundColor Yellow

# ============================================
# Step 5: Create the Agent0 SPA app registration
# ============================================

$spaBody = @{
    displayName = "Agent0 SPA"
    signInAudience = "AzureADMyOrg"
    spa = @{
        redirectUris = @("http://localhost:8080")
    }
    requiredResourceAccess = @(
        # Microsoft Graph User.Read
        @{
            resourceAppId = $graphAppId
            resourceAccess = @(
                @{
                    id = $userReadScopeId
                    type = "Scope"
                }
            )
        },
        # Agent Blueprint access_as_user
        @{
            resourceAppId = $blueprint.appId
            resourceAccess = @(
                @{
                    id = $scopeId
                    type = "Scope"
                }
            )
        }
    )
} | ConvertTo-Json -Depth 10

$spaApp = Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/applications" `
    -Body $spaBody `
    -ContentType "application/json"

Write-Host ""
Write-Host "=== Agent0 SPA Created ===" -ForegroundColor Green
Write-Host "Application (client) ID: $($spaApp.appId)"

# Create service principal for SPA
$spaPrincipalBody = @{
    appId = $spaApp.appId
} | ConvertTo-Json

$spaPrincipal = Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/servicePrincipals" `
    -Body $spaPrincipalBody `
    -ContentType "application/json"

# Pre-authorize the SPA to call the Blueprint API
$preAuthBody = @{
    api = @{
        oauth2PermissionScopes = @(
            @{
                id = $scopeId
                adminConsentDescription = "Allows the app to access Agent0 API on behalf of the signed-in user"
                adminConsentDisplayName = "Access Agent0 API"
                isEnabled = $true
                type = "User"
                value = "access_as_user"
                userConsentDescription = "Allow the app to access Agent0 API on your behalf"
                userConsentDisplayName = "Access Agent0 API"
            }
        )
        preAuthorizedApplications = @(
            @{
                appId = $spaApp.appId
                permissionIds = @($scopeId)
            }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-MgGraphRequest -Method PATCH `
    -Uri "https://graph.microsoft.com/beta/applications/$($blueprint.id)" `
    -Body $preAuthBody `
    -ContentType "application/json"

Write-Host "SPA pre-authorized to call Blueprint API"

# ============================================
# Step 6: Grant admin consent
# ============================================

$graphSp = Get-MgServicePrincipal -Filter "appId eq '$graphAppId'"

# Grant consent for Microsoft Graph User.Read to Blueprint Principal
$grantBody = @{
    clientId = $blueprintPrincipal.id
    consentType = "AllPrincipals"
    resourceId = $graphSp.Id
    scope = "User.Read"
} | ConvertTo-Json

Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/oauth2PermissionGrants" `
    -Body $grantBody `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue

# Grant consent for SPA to Graph
$grantSpaGraphBody = @{
    clientId = $spaPrincipal.id
    consentType = "AllPrincipals"
    resourceId = $graphSp.Id
    scope = "User.Read"
} | ConvertTo-Json

Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/oauth2PermissionGrants" `
    -Body $grantSpaGraphBody `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue

# Grant consent for SPA to Blueprint
$grantSpaApiBody = @{
    clientId = $spaPrincipal.id
    consentType = "AllPrincipals"
    resourceId = $blueprintPrincipal.id
    scope = "access_as_user"
} | ConvertTo-Json

Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/oauth2PermissionGrants" `
    -Body $grantSpaApiBody `
    -ContentType "application/json" `
    -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== Admin consent granted ===" -ForegroundColor Green

# ============================================
# Output configuration for .env file
# ============================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Copy these values to your .env file:" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Microsoft Entra ID Configuration"
Write-Host "ENTRA_TENANT_ID='$tenantId'"
Write-Host "ENTRA_CLIENT_ID='$($blueprint.appId)'"
Write-Host "ENTRA_AUDIENCE='api://$($blueprint.appId)'"
Write-Host ""
Write-Host "# Agent ID Configuration"
Write-Host "AGENT_BLUEPRINT_ID='$($blueprint.appId)'"
Write-Host "AGENT_IDENTITY_ID='$($agentIdentity.appId)'"
Write-Host ""
Write-Host "# For LOCAL DEVELOPMENT ONLY (not for production!)"
Write-Host "USE_MANAGED_IDENTITY='false'"
Write-Host "ENTRA_CLIENT_SECRET='$($secret.secretText)'"
Write-Host ""
Write-Host "# For PRODUCTION (Azure hosted with Managed Identity)"
Write-Host "# USE_MANAGED_IDENTITY='true'"
Write-Host "# AZURE_MANAGED_IDENTITY_CLIENT_ID='your-uami-client-id'"
Write-Host ""
Write-Host "# Frontend Entra Configuration"
Write-Host "VITE_ENTRA_TENANT_ID='$tenantId'"
Write-Host "VITE_ENTRA_CLIENT_ID='$($spaApp.appId)'"
Write-Host "VITE_ENTRA_API_SCOPE='api://$($blueprint.appId)/access_as_user'"
Write-Host ""

# Disconnect
Disconnect-MgGraph
```

### Option 1b: Configure Federated Identity Credential (Production)

For production deployments using Managed Identity, run this additional script:

```powershell
# Connect to Microsoft Graph
Connect-MgGraph -Scopes "Application.ReadWrite.All"

# Set these values from Step 1
$blueprintObjectId = "your-blueprint-object-id"  # Object ID (not App ID)
$managedIdentityPrincipalId = "your-uami-principal-id"  # Object ID of your UAMI
$tenantId = (Get-MgContext).TenantId

# Create Federated Identity Credential
$ficBody = @{
    name = "ManagedIdentityFIC"
    issuer = "https://login.microsoftonline.com/$tenantId/v2.0"
    subject = $managedIdentityPrincipalId
    audiences = @("api://AzureADTokenExchange")
    description = "Trust the User Assigned Managed Identity for Agent ID"
} | ConvertTo-Json

Invoke-MgGraphRequest -Method POST `
    -Uri "https://graph.microsoft.com/beta/applications/$blueprintObjectId/federatedIdentityCredentials" `
    -Body $ficBody `
    -ContentType "application/json"

Write-Host "Federated Identity Credential created!" -ForegroundColor Green
Write-Host ""
Write-Host "Update your .env for production:" -ForegroundColor Cyan
Write-Host "USE_MANAGED_IDENTITY='true'"
Write-Host "AZURE_MANAGED_IDENTITY_CLIENT_ID='$managedIdentityPrincipalId'"

Disconnect-MgGraph
```

### Option 2: Manual Setup (Entra Admin Center)

> **Note**: The Entra Admin Center UI for Agent ID is still being developed. Some steps may require using Graph Explorer or PowerShell.

#### Step 1: Create Agent Identity Blueprint

1. Go to [entra.microsoft.com](https://entra.microsoft.com) → **Identity** → **Applications** → **App registrations**
2. Click **+ New registration**
3. Configure:
   - **Name**: `Agent0 Blueprint`
   - **Supported account types**: Single tenant
4. Click **Register**
5. Note the **Application (client) ID** and **Directory (tenant) ID**

##### Expose an API:
1. Go to **Expose an API**
2. Click **Set** next to Application ID URI → Set to `api://{client-id}`
3. Click **+ Add a scope**:
   - **Scope name**: `access_as_user`
   - **Who can consent**: Admins and users
   - **Admin consent display name**: `Access Agent0 API`
   - **Admin consent description**: `Allows the app to access Agent0 API on behalf of the signed-in user`
   - **State**: Enabled

##### Add API Permissions:
1. Go to **API permissions** → **+ Add a permission**
2. Select **Microsoft Graph** → **Delegated permissions** → `User.Read`
3. Click **Grant admin consent for [tenant]**

##### Create Client Secret (for local development only):
1. Go to **Certificates & secrets** → **+ New client secret**
2. Add a description and expiry
3. **Copy the secret value immediately** (shown only once)

> ⚠️ **Warning**: Client secrets are for **LOCAL DEVELOPMENT ONLY**. For production, configure a Federated Identity Credential with Managed Identity.

#### Step 2: Create Agent Identity (via Graph Explorer)

Use [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer) to create the Agent Identity:

```http
POST https://graph.microsoft.com/beta/servicePrincipals/microsoft.graph.agentIdentity
Content-Type: application/json

{
  "displayName": "Agent0 Identity",
  "agentIdentityBlueprintId": "{your-blueprint-app-id}"
}
```

Note the `appId` from the response - this is your `AGENT_IDENTITY_ID`.

#### Step 3: Create Agent0 SPA App Registration

1. Go to **App registrations** → **+ New registration**
2. Configure:
   - **Name**: `Agent0 SPA`
   - **Supported account types**: Single tenant
   - **Redirect URI**: 
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:8080`
3. Click **Register**
4. Note the **Application (client) ID**

##### Add API Permissions:
1. Go to **API permissions** → **+ Add a permission**
2. Click **My APIs** → Select **Agent0 Blueprint** → Check `access_as_user` → **Add permissions**
3. Add **Microsoft Graph** → **Delegated** → `User.Read`
4. Click **Grant admin consent for [tenant]**

#### Step 4: Pre-authorize the SPA (Optional)

This skips the consent prompt for users:

1. Go back to **Agent0 Blueprint** → **Expose an API**
2. Under **Authorized client applications**, click **+ Add a client application**
3. Enter the **Agent0 SPA** client ID
4. Check the `access_as_user` scope
5. Click **Add application**

## Installation

1. Clone the repository:
```bash
git clone https://github.com/merill/agent0-agentid.git
cd agent0-agentid
```

2. Copy the environment template and fill in your values:
```bash
cp .env.example .env
```

3. Edit `.env` with your Agent ID configuration (from the setup steps above):
```env
# Microsoft Entra ID Configuration
ENTRA_TENANT_ID='your-tenant-id'
ENTRA_CLIENT_ID='your-blueprint-app-id'
ENTRA_AUDIENCE='api://your-blueprint-app-id'

# Agent ID Configuration
AGENT_BLUEPRINT_ID='your-blueprint-app-id'
AGENT_IDENTITY_ID='your-agent-identity-app-id'

# For LOCAL DEVELOPMENT ONLY (not for production!)
USE_MANAGED_IDENTITY='false'
ENTRA_CLIENT_SECRET='your-blueprint-client-secret'

# For PRODUCTION (Azure hosted with Managed Identity)
# USE_MANAGED_IDENTITY='true'
# AZURE_MANAGED_IDENTITY_CLIENT_ID='your-uami-client-id'

# Frontend Entra Configuration
VITE_ENTRA_TENANT_ID='your-tenant-id'
VITE_ENTRA_CLIENT_ID='your-spa-client-id'
VITE_ENTRA_API_SCOPE='api://your-blueprint-app-id/access_as_user'

# OpenAI Configuration
OPENAI_API_KEY='your-openai-api-key'
```

4. Install dependencies:
```bash
# Install server dependencies
cd server
npm install
cd ..

# Install client dependencies
cd client
npm install
cd ..
```

## Running Agent0

### Start the Server
Open a terminal and run:
```bash
cd server
npm run dev
```

### Start the Client
Open another terminal and run:
```bash
cd client
npm run dev
```

## Using Agent0

1. Open [http://localhost:8080](http://localhost:8080)
2. Click **Log In** to authenticate with Microsoft Entra ID
3. Start a new chat

### Test First-Party Tool Calling

Try asking the AI agent about yourself:

> "Who am I? Give me all the details you have"

The agent will use the `getUserInfo` tool to call Microsoft Graph on your behalf and return your profile information.

## Features

- ✅ Sign in / Sign out with Microsoft Entra ID
- ✅ **Agent Identity Blueprint** for managing agent capabilities
- ✅ **Agent Identity** for performing actions on behalf of users
- ✅ **Two-stage OBO flow** (Agent ID protocol)
- ✅ **Managed Identity support** for production deployments
- ✅ Protected API with JWT validation + Agent ID claims
- ✅ First-party tool calling (getUserInfo)
- ✅ Streaming AI responses
- ✅ Chat history persistence
- ✅ Light/Dark theme

## Agent ID Token Claims

When using Agent ID, tokens contain additional claims for audit and security:

| Claim | Description | Example |
|-------|-------------|---------|
| `xms_act_fct` | Actor facet (11 = AgentIdentity) | `"11"` |
| `xms_sub_fct` | Subject facet | `"11"` or `"13"` |
| `xms_par_app_azp` | Parent app ID (Blueprint) | `"guid"` |
| `xms_idrel` | Identity relationship | `"7"` |

## Troubleshooting

### 401 Unauthorized on API calls
- Ensure the SPA has API permission to call the Agent Blueprint
- Check that admin consent has been granted
- Verify `AGENT_BLUEPRINT_ID` and `AGENT_IDENTITY_ID` are set correctly
- Clear browser localStorage and re-login

### Stage 1 token exchange fails (Managed Identity)
- Verify `AZURE_MANAGED_IDENTITY_CLIENT_ID` is set correctly
- Ensure the app is running in Azure (App Service, Container Apps, etc.)
- Check that the Federated Identity Credential is configured on the Blueprint
- Verify the FIC subject matches the Managed Identity principal ID

### Stage 2 OBO token exchange fails
- Verify the Agent Identity has `User.Read` Graph permission with admin consent
- Check that the Agent Identity's `agentIdentityBlueprintId` matches your Blueprint
- Check the server logs for detailed error messages

### Legacy OBO fails (client secret)
- Verify `ENTRA_CLIENT_SECRET` is set correctly
- This should only be used for local development
- Check that `USE_MANAGED_IDENTITY` is set to `false`

### CORS errors
- Ensure `ALLOWED_ORIGINS` in `.env` includes `http://localhost:8080`

## Learn More

- [Microsoft Entra Agent ID Platform](https://learn.microsoft.com/en-us/entra/agent-id/identity-platform/what-is-agent-id-platform)
- [Agent Identity Blueprints](https://learn.microsoft.com/en-us/entra/agent-id/identity-platform/agent-blueprint)
- [Request Agent Tokens (Autonomous)](https://learn.microsoft.com/en-us/entra/agent-id/identity-platform/autonomous-agent-request-tokens)
- [Agent OBO Flow](https://learn.microsoft.com/en-us/entra/agent-id/identity-platform/agent-on-behalf-of-oauth-flow)
- [Agent Token Claims Reference](https://learn.microsoft.com/en-us/entra/agent-id/identity-platform/agent-token-claims)
- [On-Behalf-Of Flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow)
- [MSAL React Documentation](https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-v2-react)
