import fastify from "fastify";
import path from "path";

import router from "./router";

const server = fastify({
  // Logger used for production only
  logger: process.env.NODE_ENV !== "development",
});

server.register(router);

server.register(require("@fastify/static"), {
  root: path.join(__dirname, "../", "public"),
  prefix: "/public/",
});

export default server;
