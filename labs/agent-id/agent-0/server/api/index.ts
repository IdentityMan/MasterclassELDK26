import type { VercelRequest, VercelResponse } from "@vercel/node";
import { build } from "../index.js";

let app: Awaited<ReturnType<typeof build>> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization");
    res.status(200).end();
    return;
  }

  if (!app) {
    app = await build();
    await app.ready();
  }

  await app.ready();
  app.server.emit("request", req, res);
}
