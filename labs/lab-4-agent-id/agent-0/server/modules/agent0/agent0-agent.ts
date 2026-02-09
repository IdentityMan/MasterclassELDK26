import { streamText, tool } from "ai";
import ky from "ky";
import { z } from "zod";
import * as msal from "@azure/msal-node";

import { openai } from "@ai-sdk/openai";

import { Message } from "./agent0-types.js";

// ============================================================================
// Agent ID Two-Stage Token Exchange Flow
// ============================================================================
// Stage 1: Get exchange token (T1) using Managed Identity or client secret
// Stage 2: Perform OBO to get downstream resource token (e.g., Microsoft Graph)
// ============================================================================

// Error types for better error handling
interface TokenExchangeError {
  stage: "config" | "msi" | "stage1" | "stage2" | "graph";
  error: string;
  errorDescription?: string;
  errorCode?: number;
  errorUri?: string;
}

interface TokenExchangeResult {
  token?: string;
  error?: TokenExchangeError;
}

/**
 * Parse Entra ID error response
 */
function parseEntraError(errorBody: Record<string, unknown>): Partial<TokenExchangeError> {
  return {
    error: (errorBody.error as string) || "unknown_error",
    errorDescription: (errorBody.error_description as string) || undefined,
    errorCode: Array.isArray(errorBody.error_codes) ? errorBody.error_codes[0] : undefined,
    errorUri: (errorBody.error_uri as string) || undefined,
  };
}

/**
 * Get a token from Azure Managed Identity
 * Used when running in Azure (App Service, Container Apps, AKS, etc.)
 */
async function getManagedIdentityToken(clientId: string): Promise<string | null> {
  try {
    const managedIdentityConfig: msal.ManagedIdentityConfiguration = {
      managedIdentityIdParams: {
        userAssignedClientId: clientId,
      },
    };

    const managedIdentityApp = new msal.ManagedIdentityApplication(managedIdentityConfig);

    const managedIdentityRequest: msal.ManagedIdentityRequestParams = {
      resource: "api://AzureADTokenExchange",
    };

    const response = await managedIdentityApp.acquireToken(managedIdentityRequest);
    return response?.accessToken || null;
  } catch (error) {
    console.error("Failed to get Managed Identity token:", error);
    return null;
  }
}

/**
 * Stage 1: Exchange Managed Identity token for Agent Identity exchange token (T1)
 * This uses the client_credentials grant with fmi_path parameter
 */
async function getAgentExchangeToken(
  tenantId: string,
  agentBlueprintId: string,
  agentIdentityId: string,
  managedIdentityToken: string
): Promise<string | null> {
  try {
    // MSAL doesn't directly support fmi_path parameter required for Agent Identity,
    // so we use raw HTTP for Stage 1
    const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: agentBlueprintId,
      scope: "api://AzureADTokenExchange/.default",
      fmi_path: agentIdentityId,
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: managedIdentityToken,
    });

    const response = await ky
      .post(tokenEndpoint, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      })
      .json<{ access_token: string }>();

    return response.access_token;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const httpError = error as { response: Response };
      try {
        const errorBody = await httpError.response.json();
        console.error("Stage 1 token exchange failed:", JSON.stringify(errorBody, null, 2));
      } catch {
        console.error("Stage 1 token exchange failed:", error);
      }
    } else {
      console.error("Stage 1 token exchange failed:", error);
    }
    return null;
  }
}

/**
 * Stage 2: Perform OBO flow using exchange token (T1) as client assertion
 * This exchanges the user's token (Tc) for a downstream resource token using
 */
async function performAgentOBO(
  tenantId: string,
  agentIdentityId: string,
  exchangeToken: string,
  userToken: string,
  scope: string
): Promise<string | null> {
  try {
    const msalConfig: msal.Configuration = {
      auth: {
        clientId: agentIdentityId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientAssertion: exchangeToken,
      },
    };

    const cca = new msal.ConfidentialClientApplication(msalConfig);

    const oboRequest: msal.OnBehalfOfRequest = {
      oboAssertion: userToken,
      scopes: [scope],
    };

    const response = await cca.acquireTokenOnBehalfOf(oboRequest);
    return response?.accessToken || null;
  } catch (error: unknown) {
    console.error("Stage 2 OBO failed:", error);
    if (error instanceof msal.AuthError) {
      console.error("MSAL Error Code:", error.errorCode);
      console.error("MSAL Error Message:", error.errorMessage);
    }
    return null;
  }
}

/**
 * Fallback: Legacy OBO flow using client secret (for local development only)
 * DO NOT USE IN PROD
 * This implements the two-stage Agent ID flow using client_secret instead of MSI:
 * Stage 1: Blueprint + client_secret + fmi_path → T1 (exchange token)
 * Stage 2: Agent Identity + T1 + user_token → Graph token (OBO) using MSAL
 */
async function legacyOBOWithClientSecret(
  tenantId: string,
  agentBlueprintId: string,
  agentIdentityId: string,
  clientSecret: string,
  userToken: string,
  scope: string
): Promise<TokenExchangeResult> {
  console.warn(
    "⚠️  WARNING: Using client secret for Agent ID flow. " +
    "This is for LOCAL DEVELOPMENT ONLY. " +
    "In production, use Managed Identity with USE_MANAGED_IDENTITY=true"
  );

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  // Stage 1: Get exchange token (T1) using client_secret and fmi_path
  // Note: MSAL doesn't support fmi_path parameter, so we use raw HTTP for Stage 1
  let exchangeToken: string;
  try {
    const stage1Params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: agentBlueprintId,
      client_secret: clientSecret,
      scope: "api://AzureADTokenExchange/.default",
      fmi_path: agentIdentityId,
    });

    console.log("Stage 1: Requesting exchange token (T1) with client_secret...");

    const stage1Response = await ky
      .post(tokenEndpoint, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: stage1Params.toString(),
      })
      .json<{ access_token: string }>();

    exchangeToken = stage1Response.access_token;
    console.log("Stage 1: Successfully obtained exchange token (T1)");
  } catch (error: unknown) {
    if (error && typeof error === "object" && "response" in error) {
      const httpError = error as { response: Response };
      try {
        const errorBody = await httpError.response.json() as Record<string, unknown>;
        console.error("Stage 1 (client_secret) failed:", JSON.stringify(errorBody, null, 2));
        const parsedError = parseEntraError(errorBody);
        return {
          error: {
            stage: "stage1" as const,
            error: parsedError.error || "unknown_error",
            errorDescription: parsedError.errorDescription,
            errorCode: parsedError.errorCode,
            errorUri: parsedError.errorUri,
          },
        };
      } catch {
        console.error("Stage 1 (client_secret) failed:", error);
      }
    } else {
      console.error("Stage 1 (client_secret) failed:", error);
    }
    return {
      error: {
        stage: "stage1",
        error: "token_exchange_failed",
        errorDescription: "Failed to obtain exchange token (T1) from Agent Identity Blueprint",
      },
    };
  }

  // Stage 2: Perform OBO using T1 as client_assertion
  try {
    const msalConfig: msal.Configuration = {
      auth: {
        clientId: agentIdentityId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientAssertion: exchangeToken,
      },
    };

    const cca = new msal.ConfidentialClientApplication(msalConfig);

    const oboRequest: msal.OnBehalfOfRequest = {
      oboAssertion: userToken,
      scopes: [scope],
    };

    console.log("Stage 2: Performing OBO with exchange token using...");

    const response = await cca.acquireTokenOnBehalfOf(oboRequest);

    if (!response?.accessToken) {
      return {
        error: {
          stage: "stage2",
          error: "obo_failed",
          errorDescription: "acquireTokenOnBehalfOf returned null response",
        },
      };
    }

    console.log("Stage 2: Successfully obtained Graph token via OBO");
    return { token: response.accessToken };
  } catch (error: unknown) {
    console.error("Stage 2 OBO failed:", error);
    
    if (error instanceof msal.AuthError) {
      return {
        error: {
          stage: "stage2",
          error: error.errorCode,
          errorDescription: error.errorMessage,
        },
      };
    }
    
    return {
      error: {
        stage: "stage2",
        error: "obo_failed",
        errorDescription: error instanceof Error ? error.message : "Failed to perform OBO token exchange with Agent Identity",
      },
    };
  }
}

/**
 * Main function to get a Microsoft Graph token using the Agent ID flow
 * Supports both Managed Identity (production) and client secret (dev) paths
 */
async function getGraphToken(apiToken: string): Promise<TokenExchangeResult> {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const agentBlueprintId = process.env.AGENT_BLUEPRINT_ID;
  const agentIdentityId = process.env.AGENT_IDENTITY_ID;
  const useManagedIdentity = process.env.USE_MANAGED_IDENTITY === "true";
  const managedIdentityClientId = process.env.AZURE_MANAGED_IDENTITY_CLIENT_ID;
  const clientSecret = process.env.ENTRA_CLIENT_SECRET;

  if (!tenantId || !agentBlueprintId || !agentIdentityId) {
    const missing = [];
    if (!tenantId) missing.push("ENTRA_TENANT_ID");
    if (!agentBlueprintId) missing.push("AGENT_BLUEPRINT_ID");
    if (!agentIdentityId) missing.push("AGENT_IDENTITY_ID");
    console.error("Missing required Agent ID configuration:", missing.join(", "));
    return {
      error: {
        stage: "config",
        error: "configuration_error",
        errorDescription: `Missing required environment variables: ${missing.join(", ")}`,
      },
    };
  }

  const graphScope = "https://graph.microsoft.com/User.Read";

  // Production path: Use Managed Identity for two-stage token exchange
  if (useManagedIdentity) {
    if (!managedIdentityClientId) {
      console.error("USE_MANAGED_IDENTITY is true but AZURE_MANAGED_IDENTITY_CLIENT_ID is not set");
      return {
        error: {
          stage: "config",
          error: "configuration_error",
          errorDescription: "USE_MANAGED_IDENTITY is true but AZURE_MANAGED_IDENTITY_CLIENT_ID is not set",
        },
      };
    }

    console.log("Using Managed Identity for Agent ID token exchange...");

    // Get token from Managed Identity
    const msiToken = await getManagedIdentityToken(managedIdentityClientId);
    if (!msiToken) {
      console.error("Failed to get Managed Identity token");
      return {
        error: {
          stage: "msi",
          error: "msi_token_failed",
          errorDescription: "Failed to get token from Managed Identity. Ensure the app is running in Azure with a configured User-Assigned Managed Identity.",
        },
      };
    }

    // Stage 1: Exchange MSI token for Agent Identity exchange token
    const exchangeToken = await getAgentExchangeToken(
      tenantId,
      agentBlueprintId,
      agentIdentityId,
      msiToken
    );
    if (!exchangeToken) {
      console.error("Stage 1 failed: Could not get exchange token");
      return {
        error: {
          stage: "stage1",
          error: "exchange_token_failed",
          errorDescription: "Failed to exchange MSI token for Agent Identity exchange token (T1)",
        },
      };
    }

    // Stage 2: Perform OBO to get Graph token
    const graphToken = await performAgentOBO(
      tenantId,
      agentIdentityId,
      exchangeToken,
      apiToken,
      graphScope
    );

    if (!graphToken) {
      return {
        error: {
          stage: "stage2",
          error: "obo_failed",
          errorDescription: "Failed to perform OBO with Agent Identity",
        },
      };
    }

    return { token: graphToken };
  }

  // Development path: Use client secret (two-stage Agent ID flow)
  if (clientSecret) {
    return legacyOBOWithClientSecret(
      tenantId,
      agentBlueprintId,
      agentIdentityId,
      clientSecret,
      apiToken,
      graphScope
    );
  }

  console.error(
    "No authentication method configured. Set either:\n" +
    "  - USE_MANAGED_IDENTITY=true with AZURE_MANAGED_IDENTITY_CLIENT_ID (production)\n" +
    "  - ENTRA_CLIENT_SECRET (local development only)"
  );
  return {
    error: {
      stage: "config",
      error: "no_auth_method",
      errorDescription: "No authentication method configured. Set USE_MANAGED_IDENTITY=true with AZURE_MANAGED_IDENTITY_CLIENT_ID (production) or ENTRA_CLIENT_SECRET (local development)",
    },
  };
}

/**
 * Format a user-friendly error message from TokenExchangeError
 */
function formatErrorMessage(err: TokenExchangeError): string {
  const stageNames: Record<string, string> = {
    config: "Configuration",
    msi: "Managed Identity",
    stage1: "Stage 1 (Exchange Token)",
    stage2: "Stage 2 (OBO)",
    graph: "Microsoft Graph",
  };

  let message = `**${stageNames[err.stage] || err.stage} Error**\n\n`;
  message += `Error: \`${err.error}\`\n\n`;
  
  if (err.errorDescription) {
    message += `${err.errorDescription}\n\n`;
  }

  if (err.errorCode) {
    message += `Error Code: ${err.errorCode}\n`;
  }

  if (err.errorUri) {
    message += `More info: ${err.errorUri}\n`;
  }

  // Add helpful suggestions based on error type
  if (err.error === "unauthorized_client" && err.errorCode === 7000112) {
    message += "\n**Suggestion**: The application is disabled. Enable it in the Entra Portal in the Agents blade.";
  } else if (err.error === "invalid_client") {
    message += "\n**Suggestion**: Check that ENTRA_CLIENT_SECRET is correct and not expired.";
  } else if (err.error === "invalid_grant") {
    message += "\n**Suggestion**: The user token may be expired. Try logging out and back in.";
  }

  return message;
}

async function getUserInfo(apiToken: string) {
  try {
    // Exchange API token for Graph token using Agent ID two-stage flow
    const result = await getGraphToken(apiToken);

    // Check for token exchange errors
    if (result.error) {
      console.error("Token exchange failed:", result.error);
      return { error: formatErrorMessage(result.error) };
    }

    if (!result.token) {
      return { error: "Failed to acquire Graph token. No token returned." };
    }

    // Call Microsoft Graph API to get user information
    const response = await ky
      .get("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${result.token}`,
        },
      })
      .json();
    return { result: JSON.stringify(response) };
  } catch (error) {
    console.error("Error fetching user info from Microsoft Graph:", error);

    // Handle Graph API errors
    if (error instanceof Error && "response" in error) {
      const kyError = error as { response?: { status?: number; statusText?: string } };
      const status = kyError.response?.status;
      const statusText = kyError.response?.statusText;

      if (status === 401) {
        return {
          error: formatErrorMessage({
            stage: "graph",
            error: "unauthorized",
            errorDescription: "The Graph token was rejected. This may indicate insufficient permissions or an expired token.",
          }),
        };
      }

      if (status === 403) {
        return {
          error: formatErrorMessage({
            stage: "graph",
            error: "forbidden",
            errorDescription: "Access denied. The application may not have the required Graph API permissions (User.Read).",
          }),
        };
      }

      return {
        error: formatErrorMessage({
          stage: "graph",
          error: `http_${status}`,
          errorDescription: `Graph API error: ${status} ${statusText}`,
        }),
      };
    }

    return {
      error: formatErrorMessage({
        stage: "graph",
        error: "unknown_error",
        errorDescription: error instanceof Error ? error.message : "An unknown error occurred",
      }),
    };
  }
}

export async function agent0(messages: Message[], token: string) {
  const getUserInfoTool = tool({
    description: "Get information about the logged in user",
    parameters: z.object({}),
    execute: async () => await getUserInfo(token),
  });

  const stream = streamText({
    model: openai("gpt-4-turbo"),
    maxSteps: 5,
    tools: {
      getUserInfo: getUserInfoTool,
    },
    system: "assistant",
    messages: messages,
  });

  return stream;
}
