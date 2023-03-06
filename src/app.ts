import fastify from "fastify";
import path from "path";

import router from "./router";

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

const environment =
  (process.env.NODE_ENV as keyof typeof envToLogger) ?? "development";

const server = fastify({
  logger: envToLogger[environment] ?? true,
});

server.register(router);

server.register(require("@fastify/static"), {
  root: path.join(__dirname, "../", "public"),
  //  prefix: "/public/",
});

export default server;
