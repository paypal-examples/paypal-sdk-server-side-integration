import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import createSubscription from "../subscription/create-subscription";
import { CreateSubscriptionRequestBody } from "@paypal/paypal-js";

async function createSubscriptionHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  /**
   * To create subscription, you must create a product and a subscription plan.
   * Steps:
   * 1. Create a product to represent your goods or services.
   * 2. Create a plan to represent the payment cycles for your subscription.
   * 3. Replace the __PLAN_ID__ below with the Plan Id created above.
   * Note:
   * multiple subscribers can subscribe to the same plan.
   * Any update to the pricing scheme will also be applicable for future payments of all active subscriptions.
   *
   * Reference: https://developer.paypal.com/docs/subscriptions/integrate/
   */
  const body: CreateSubscriptionRequestBody = {
    plan_id: "__PLAN_ID__",
  };
  const { data } = await createSubscription(body);
  reply.send(data);
}

export async function createSubscriptionController(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/create-subscription",
    handler: createSubscriptionHandler,
    schema: {},
  });
}
