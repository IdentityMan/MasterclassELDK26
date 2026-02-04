import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";

import config from "./config.js";
import cors from "./cors.js";
import sensible from "./sensible.js";
import entraAuth from "./entra-auth.js";

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  await Promise.all([fastify.register(config), fastify.register(sensible)]);
  await Promise.all([fastify.register(entraAuth)]);
  await Promise.all([fastify.register(cors)]);
});
