import fastify, { FastifyServerOptions } from "fastify";
import fastifyStatic from "@fastify/static";
import path from "path";

import router from "./router";

export default function buildApp(options: FastifyServerOptions = {}) {
  const server = fastify(options);

  server.register(router);

  server.register(fastifyStatic, {
    root: path.join(__dirname, "../", "public"),
  });

  return server;
}
