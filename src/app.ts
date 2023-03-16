import fastify, { FastifyServerOptions } from "fastify";
import path from "path";

import router from "./router";

export default function buildApp(options: FastifyServerOptions = {}) {
  const server = fastify(options);

  server.register(router);

  server.register(require("@fastify/static"), {
    root: path.join(__dirname, "../", "public"),
  });

  return server;
}
