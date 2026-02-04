![Agent0](/client/public/agent0.svg "Agent0 Logo")

## What is Agent0

Agent0 is a full stack demo app built using **Microsoft Entra ID (Agent ID)**, React, Fastify & OpenAI to showcase an **AI agent with 1st Party Tool calling** where the backend API and the Tool share the same API audience.

This is a way to demonstrate authenticated tool calling on behalf of the logged in user without giving any direct permissions to the AI agent and the underlying LLM itself.

## How does it work

![sequence](/docs/sequence.png)

In this example, we are using [MSAL React](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react) to login the end user on the React web application (our AI chat interface). This establishes the user session on the browser while keeping the backend API service completely stateless.

The Fastify API server is built with a custom Entra ID JWT validation plugin using [jose](https://github.com/panva/jose) to secure the `/server/agent0` endpoint and only allows logged in users to interact with it.

When the user logs in, Microsoft Entra ID issues an Access Token with the configured API audience on behalf of the user which is then presented by the browser to the API server every time the user interacts with the chat interface and submits a prompt.

The AI agent setup on the API server has a Tool defined (`getUserInfo`) that interacts with Microsoft Graph and can share details about a logged in user but requires a valid Access Token. The way this is setup, the API server extracts the Access Token from browser requests and makes it available for the Tool, allowing the LLM to do the Tool call on behalf of the logged in user without having direct access to the token.

## Agent0 Features

This sample demo covers:
- Signup / Login / Logout Experience with Microsoft Entra ID
- Protected API for agent interactions
- First party Tool calling (get-user-info via Microsoft Graph)
- Contextualized chat interactions
- Streamed responses from backend API
- Saved chat history
- UI theming (Light or Dark mode)

## Learn about Microsoft Entra Agent ID

To learn more about Microsoft Entra Agent ID platform visit [https://learn.microsoft.com/en-us/entra/agent-id](https://learn.microsoft.com/en-us/entra/agent-id/identity-platform/what-is-agent-id-platform)
