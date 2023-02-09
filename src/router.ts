import type { FastifyInstance } from "fastify";
import { clientTokenController } from "./controller/client-token-controller";
import { createOrderController } from "./controller/order-controller";
import { configController } from "./controller/config-controller";

export default async function router(fastify: FastifyInstance) {
  fastify.register(clientTokenController, { prefix: "/api/paypal" });
  fastify.register(createOrderController, { prefix: "/api/paypal" });
  fastify.register(configController, { prefix: "/api/paypal" });
}
