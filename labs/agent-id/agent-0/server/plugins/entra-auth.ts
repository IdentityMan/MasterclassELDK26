import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { createRemoteJWKSet, jwtVerify, JWTPayload } from "jose";

// Agent ID specific claims
interface AgentIdClaims {
  xms_act_fct?: string;      // Actor facets (11 = AgentIdentity)
  xms_sub_fct?: string;      // Subject facets (11 = AgentIdentity, 13 = AgentUser)
  xms_idrel?: string;        // Identity relationship (7 = service principal)
  xms_par_app_azp?: string;  // Parent application ID (Agent Blueprint)
  xms_tnt_fct?: string;      // Tenant facets
}

// Extended JWT payload with Agent ID claims
interface AgentIdJWTPayload extends JWTPayload, AgentIdClaims {}

// Extend FastifyRequest to include user and token
declare module "fastify" {
  interface FastifyRequest {
    user?: AgentIdJWTPayload;
    token?: string;
    isAgentIdToken?: boolean;  // Flag indicating if token has Agent ID claims
  }
  interface FastifyInstance {
    requireAuth: () => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    getToken: (request: FastifyRequest) => string | undefined;
  }
}

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  const tenantId = process.env.ENTRA_TENANT_ID;
  const audience = process.env.ENTRA_AUDIENCE;
  const clientId = process.env.ENTRA_CLIENT_ID;
  const agentBlueprintId = process.env.AGENT_BLUEPRINT_ID;

  if (!tenantId || !audience) {
    throw new Error(
      "ENTRA_TENANT_ID and ENTRA_AUDIENCE must be set in environment variables"
    );
  }

  // Accept both the api:// URI and the raw client ID as valid audiences
  const validAudiences = [audience];
  if (clientId && clientId !== audience) {
    validAudiences.push(clientId);
  }
  // Also add the client ID extracted from api:// URI if present
  if (audience.startsWith("api://")) {
    validAudiences.push(audience.replace("api://", ""));
  }
  // Add Agent Blueprint ID as valid audience (Agent ID tokens use this)
  if (agentBlueprintId) {
    validAudiences.push(agentBlueprintId);
    validAudiences.push(`api://${agentBlueprintId}`);
  }

  // Accept both v1.0 and v2.0 token issuers
  const validIssuers = [
    `https://login.microsoftonline.com/${tenantId}/v2.0`,  // v2.0 issuer
    `https://sts.windows.net/${tenantId}/`,                // v1.0 issuer
  ];

  fastify.log.info(`Valid audiences: ${validAudiences.join(", ")}`);
  fastify.log.info(`Valid issuers: ${validIssuers.join(", ")}`);

  // Create JWKS client for token verification
  const JWKS = createRemoteJWKSet(
    new URL(
      `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
    )
  );

  /**
   * Log Agent ID specific claims for audit purposes
   */
  function logAgentIdClaims(payload: AgentIdJWTPayload, logger: typeof fastify.log) {
    if (payload.xms_act_fct || payload.xms_sub_fct || payload.xms_par_app_azp) {
      logger.info({
        agentId: {
          actorFacet: payload.xms_act_fct,
          subjectFacet: payload.xms_sub_fct,
          identityRelationship: payload.xms_idrel,
          parentAppId: payload.xms_par_app_azp,
          tenantFacet: payload.xms_tnt_fct,
        },
      }, "Agent ID token detected");
    }
  }

  // Decorate fastify with auth utilities
  fastify.decorate(
    "requireAuth",
    () => async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({ error: "Unauthorized: Missing or invalid authorization header" });
      }

      try {
        const token = authHeader.substring(7);
        
        // Log token info for debugging (remove in production)
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          fastify.log.info(`Token aud: ${payload.aud}, iss: ${payload.iss}, scp: ${payload.scp}`);
          
          // Log Agent ID claims if present
          if (payload.xms_act_fct || payload.xms_par_app_azp) {
            fastify.log.info(`Agent ID claims - xms_act_fct: ${payload.xms_act_fct}, xms_par_app_azp: ${payload.xms_par_app_azp}`);
          }
        }
        
        const { payload } = await jwtVerify(token, JWKS, {
          issuer: validIssuers,
          audience: validAudiences,
        });

        const agentPayload = payload as AgentIdJWTPayload;
        
        // Log Agent ID claims for audit
        logAgentIdClaims(agentPayload, fastify.log);
        
        // Flag if this is an Agent ID token
        request.isAgentIdToken = !!(agentPayload.xms_act_fct || agentPayload.xms_par_app_azp);
        request.user = agentPayload;
        request.token = token;
      } catch (err) {
        fastify.log.error(err, "JWT verification failed");
        return reply.status(401).send({ error: "Unauthorized: Invalid token" });
      }
    }
  );

  fastify.decorate("getToken", (request: FastifyRequest) => {
    return request.token;
  });
});
