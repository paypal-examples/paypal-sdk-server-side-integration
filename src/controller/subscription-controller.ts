import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import createSubscription from "../subscription/create-subscription";
import {
  CreateSubscriptionRequestBody,
  ShippingAddress,
} from "@paypal/paypal-js";
import config from "../config";
import activateSubscription from "../subscription/activate-subscription";

const {
  paypal: { subscriptionPlanId },
} = config;

async function createSubscriptionHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { userAction = "SUBSCRIBE_NOW" } = request.body as {
    userAction: string;
  };
  /**
   * To create subscription, you must create a product and a subscription plan.
   * Steps:
   * 1. Create a product to represent your goods or services.
   * 2. Create a plan to represent the payment cycles for your subscription.
   * 3. Replace the PAYPAL_SUBSCRIPTION_PLAN_ID in your environment variables with the Plan Id created above.
   * Note:
   * multiple subscribers can subscribe to the same plan.
   * Any update to the pricing scheme will also be applicable for future payments of all active subscriptions.
   *
   * Reference: https://developer.paypal.com/docs/subscriptions/integrate/
   */
  const body: CreateSubscriptionRequestBody = {
    plan_id: String(subscriptionPlanId),
    application_context: {
      user_action: userAction,
    },
  };
  const { data } = await createSubscription(body);
  reply.send(data);
}

export async function createSubscriptionController(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/create-subscription",
    handler: createSubscriptionHandler,
    schema: {
      body: {
        type: "object",
        required: [],
        properties: {
          userAction: {
            type: "string",
          },
        },
      },
    },
  });
}

async function activateSubscriptionHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { subscriptionId } = request.body as { subscriptionId: string };
  const { status } = await activateSubscription({
    subscriptionId,
    reason: "Activate the susbcription",
  });
  reply.send({ status });
}

export async function activateSubscriptionController(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/activate-subscription",
    handler: activateSubscriptionHandler,
    schema: {
      body: {
        type: "object",
        required: [],
        properties: {
          subscriptionId: {
            type: "string",
          },
        },
      },
    },
  });
}
