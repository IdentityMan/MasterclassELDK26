import { FastifyInstance } from "fastify";

import agent0 from "./agent0/agent0-api.js";

export default async function modules(fastify: FastifyInstance) {
  fastify.get("/server/health", async () => {
    return { status: "OK" };
  });
  await Promise.all([fastify.register(agent0)]);
}
