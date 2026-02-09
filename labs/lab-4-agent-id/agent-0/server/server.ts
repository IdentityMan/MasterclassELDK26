import * as nodeCrypto from "node:crypto";

if (typeof globalThis.crypto === "undefined") {
  // @ts-ignore
  globalThis.crypto = nodeCrypto.webcrypto;
}

import dotenv from "dotenv";

import { build } from "./index.js";

const start = async () => {
  dotenv.config();

  let fastify;

  const start = performance.now();
  try {
    fastify = await build();
  } catch (e) {
    console.error("Error occured while building fastify");
    console.error(e);
    return;
  }

  fastify.log.info(
    `Successfully built fastify instance in ${(
      performance.now() - start
    ).toFixed(2)} ms`
  );

  await fastify.listen({
    host: fastify.config.API_HOST,
    port: fastify.config.API_PORT,
  });
};

start();
