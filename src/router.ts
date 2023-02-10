import type { FastifyInstance } from "fastify";
import { clientTokenController } from "./controller/client-token-controller";
import { createOrderController } from "./controller/order-controller";
import { patchOrderController } from "./controller/patch-order-controller";
import { clientIDController } from "./controller/config-controller";

export default async function router(fastify: FastifyInstance) {
  fastify.register(clientTokenController, { prefix: "/api/paypal" });
  fastify.register(createOrderController, { prefix: "/api/paypal" });
  fastify.register(clientIDController, { prefix: "/api/paypal" });
  fastify.register(patchOrderController, { prefix: "/api/paypal" });
}
