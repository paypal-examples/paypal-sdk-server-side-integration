import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import getAuthToken from "../auth/get-auth-token";
import createOrder from "../order/create-order";

import type { CreateOrderRequestBody } from "@paypal/paypal-js";

const productDatabase = {
  "PRODUCT-123": {
    price: 50,
    status: "IN_STOCK",
  },
  "PRODUCT-456": {
    price: 100,
    status: "IN_STOCK",
  },
};

export default async function createOrderController(fastify: FastifyInstance) {
  fastify.post(
    "/create-order",
    async function (request: FastifyRequest, reply: FastifyReply) {
      const { access_token: accessToken } = await getAuthToken();

      // TODO: use this data to calculate the order amount
      console.log({ body: request.body });

      const orderPayload: CreateOrderRequestBody = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: "100.00",
            },
          },
        ],
      };

      const data = await createOrder(accessToken, orderPayload);
      reply.send(data);
    }
  );
}
