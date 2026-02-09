import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

import fastifyCors from "@fastify/cors";

export default fastifyPlugin(
  async (fastify: FastifyInstance) => {
    await fastify.register(fastifyCors, {
      origin: "*",
      allowedHeaders: ["Content-Type", "Authorization", "Set-Cookie", "X-CSRF-Token", "X-Requested-With", "Accept", "Accept-Version", "Content-Length", "Content-MD5", "Date", "X-Api-Version"],
      methods: ["GET", "OPTIONS", "PATCH", "DELETE", "POST", "PUT"],
      credentials: false,
    });
  },
  { name: "cors", dependencies: ["config"] }
);
