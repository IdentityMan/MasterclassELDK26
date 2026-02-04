import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { agent0 } from "./agent0-agent.js";
import { Message } from "./agent0-types.js";

export default async (fastify: FastifyInstance) => {
  fastify.post(
    "/server/agent0",
    {
      preHandler: fastify.requireAuth(),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { messages } = request.body as { messages: Message[] };

      if (!messages || !Array.isArray(messages)) {
        reply
          .status(400)
          .send({ error: "Messages are required and should be an array" });
        return;
      }

      try {
        const token = request.token || "";
        const response = await agent0(messages, token);

        reply
          .header("X-Vercel-AI-Data-Stream", "v1")
          .header("Content-Type", "text/plain; charset=utf-8")
          .header("Cache-Control", "no-cache")
          .header("Connection", "keep-open");

        return reply.send(response.toDataStream());
      } catch (error) {
        fastify.log.error(error);
        reply.status(500).send({ error: "Failed to get response from agent" });
      }
    }
  );
};
