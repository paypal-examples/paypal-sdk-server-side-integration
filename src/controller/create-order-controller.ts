import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import getAuthToken from "../auth/get-auth-token";
import createOrder from "../order/create-order";
import products from "../data/products.json";

import type { CreateOrderRequestBody } from "@paypal/paypal-js";

type CartItem = {
  sku: "PRODUCT_123" | "PRODUCT_456";
  quantity: number;
};

function getTotalAmount(cartItems: CartItem[]): string {
  let amountValue = 0;

  cartItems.forEach(({ sku, quantity }) => {
    if (!products[sku]) {
      throw new Error(`INVALID_PRODUCT_SKU: ${sku}`);
    }
    amountValue += parseFloat(products[sku].price) * quantity;
  });

  return amountValue.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

async function createOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { cart } = request.body as { cart: CartItem[] };
  const { access_token: accessToken } = await getAuthToken();

  const orderPayload: CreateOrderRequestBody = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: getTotalAmount(cart),
        },
      },
    ],
  };

  const data = await createOrder(accessToken, orderPayload);
  reply.send(data);
}

export default async function createOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/create-order",
    handler: createOrderHandler,
    schema: {
      body: {
        type: "object",
        required: ["cart"],
        properties: {
          cart: {
            type: "array",
            items: {
              type: "object",
              required: ["sku", "quantity"],
              properties: {
                sku: { type: "string" },
                quantity: { type: "number" },
              },
            },
          },
        },
      },
    },
  });
}
