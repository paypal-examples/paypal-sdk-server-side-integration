import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import getAuthToken from "../auth/get-auth-token";
import createOrder from "../order/create-order";
import products from "../data/products.json";

import type { CreateOrderRequestBody } from "@paypal/paypal-js";
import { onShippingChange } from "../order/patch-order";
import { retrieveOrder } from "../order/retrieve-order";

type CartItem = {
  sku: keyof typeof products;
  quantity: number;
};

function getTotalAmount(cartItems: CartItem[]): string {
  const amountValue = cartItems
    .map(({ sku, quantity }) => {
      if (!products[sku] || !Number.isInteger(quantity)) {
        return 0;
      }
      return parseFloat(products[sku].price) * quantity;
    })
    .reduce((partialSum, a) => partialSum + a, 0);

  return amountValue.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

async function createOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { cart } = request.body as { cart: CartItem[] };
  const { access_token: accessToken } = await getAuthToken();

  const totalAmount = getTotalAmount(cart);

  const orderPayload: CreateOrderRequestBody = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: totalAmount,
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: totalAmount,
            },
          },
        },
        items: cart.map(({ sku, quantity }) => {
          const { name, price } = products[sku];
          return {
            name,
            sku,
            quantity: quantity.toString(),
            unit_amount: {
              currency_code: "USD",
              value: price,
            },
          };
        }),
        shipping: {
          options: [
            {
              id: "SHIP_123",
              label: "Free Shipping",
              type: "SHIPPING",
              selected: false,
              amount: {
                value: "3.00",
                currency_code: "USD",
              },
            },
            {
              id: "SHIP_456",
              label: "Pick up in Store",
              type: "PICKUP",
              selected: false,
              amount: {
                value: "0.00",
                currency_code: "USD",
              },
            },
            {
              id: "SHIP_789",
              label: "Prime Shipping",
              type: "SHIPPING",
              selected: true,
              amount: {
                value: "8.00",
                currency_code: "USD",
              },
            },
          ],
        },
      },
    ],
  };

  const data = await createOrder(accessToken, orderPayload);
  reply.send(data);
}

export async function createOrderController(fastify: FastifyInstance) {
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

// Patch order
export type ShippingOption = {
  id: string;
  label: string;
  type: string;
  selected: boolean;
  amount: {
    value: string;
    currency_code: string;
  };
};

async function patchOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { selectedShippingOption, baseAmount, orderID } = request.body as {
    selectedShippingOption: ShippingOption;
    baseAmount:string;
    orderID: string;
  };
  const { access_token: accessToken } = await getAuthToken();

  let shippingPayload = {
    selectedShippingOption,
    baseAmount,
    orderID,
  };

  const data = await onShippingChange(accessToken, shippingPayload);
  reply.send(data);
}

export async function patchOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "PATCH",
    url: "/patch-order",
    handler: patchOrderHandler
  });
}

//retrieve order details
async function retrieveOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { access_token: accessToken } = await getAuthToken();
  const { orderID } = request.body as {orderID: string;};
  const data = await retrieveOrder(accessToken, orderID);
  reply.send(data);
}

export async function retrieveOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "GET",
    url: "/retrieve-order",
    handler: retrieveOrderHandler
  });
}