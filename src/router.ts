import type { FastifyInstance } from "fastify";
import generateClientTokenController from "./controller/generate-client-token-controller";
import { createOrderController } from "./controller/order-controller";
import getClientIDController from "./controller/get-client-id-controller";

export default async function router(fastify: FastifyInstance) {
  fastify.register(generateClientTokenController, { prefix: "/api/paypal" });
  fastify.register(createOrderController, { prefix: "/api/paypal" });
  fastify.register(getClientIDController, { prefix: "/api/paypal" });
}
