import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import getAuthToken from "../auth/get-auth-token";
import patchOrder from "../order/patch-order";
import shippings from "../data/shippings.json";

import type { ShippingAddress, ShippingOptionType, SelectedShippingOption } from "@paypal/paypal-js";

type ShippingOption = {
  id: string,
  label: string,
  type: string,
  selected: boolean,
  amount: { 
    value: string,
    currency_code: string,
  }
}

async function patchOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { shippingOptions, shippingAddress, orderId } = request.body as { shippingOptions: ShippingOption[], shippingAddress: ShippingAddress, orderId: string };
  const baseAmount = "3";

  const shippingPayload = {
    shippingOption: shippingOptions.map(({id}) => {
      const { label, type, selected, amount, currency_code } = (shippings as any)[id];
      return {
        id,
        label,
        type,
        selected,
        amount: {
            value: parseFloat(baseAmount) + parseFloat(amount.value),
            currency_code
        }
      }
    }),
    shippingAddress,
    orderId
  };

  const data = await patchOrder(shippingPayload);
  reply.send(data);
}

export async function patchOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "PATCH",
    url: "/patch-order",
    handler: patchOrderHandler,
    schema: {
      body: {
        type: "object",
        required: ["orderId", "shippingOption", "shippingAddress"],
        properties: {
          orderId: {
            type: "number"
          },
          shippingOption: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "selected"],
              properties: {
                id: { type: "string" },
                // label: { type: "string" },
                // type: { type: "string" },
                selected: { type: "boolean" }
              },
            },
          },
          shippingAddress:{
            type: "object",
            required: ["postal_code"],
            properties: {
              address_line_1: { type: "string" },
              address_line_2: { type: "string" },
              admin_area_2: { type: "string" },
              admin_area_1: { type: "string" },
              postal_code: { type: "string" },
              country_code: { type: "string" }
            }
          }
        },
      },
    },
  });
}
