import type { FastifyInstance } from "fastify";
import { clientTokenController } from "./controller/client-token-controller";
import {
  createOrderController,
  captureOrderController,
  patchOrderController,
  getOrderController,
} from "./controller/order-controller";
import { configController } from "./controller/config-controller";
import { setErrorHandler } from "./controller/error-controller";
import {
  activateSubscriptionController,
  createSubscriptionController,
  reviseSubscriptionController,
} from "./controller/subscription-controller";

export default async function router(fastify: FastifyInstance) {
  setErrorHandler(fastify);
  fastify.register(clientTokenController, { prefix: "/api/paypal" });
  fastify.register(createOrderController, { prefix: "/api/paypal" });
  fastify.register(captureOrderController, { prefix: "/api/paypal" });
  fastify.register(configController, { prefix: "/api/paypal" });
  fastify.register(patchOrderController, { prefix: "/api/paypal" });
  fastify.register(getOrderController, { prefix: "/api/paypal" });
  fastify.register(createSubscriptionController, { prefix: "/api/paypal" });
  fastify.register(activateSubscriptionController, { prefix: "/api/paypal" });
  fastify.register(reviseSubscriptionController, { prefix: "/api/paypal" });
}
