import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import getAuthToken from "../auth/get-auth-token";
import { onShippingChange } from "../order/patch-order";
import shippings from "../data/shippings.json";

import type {
  ShippingAddress,
  ShippingOptionType,
  SelectedShippingOption,
} from "@paypal/paypal-js";

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
  const { orderID } = request.body as { orderID: string };
  const { access_token: accessToken } = await getAuthToken();
  const data = await onShippingChange(accessToken, orderID);
  reply.send(data);
}

export async function patchOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "PATCH",
    url: "/patch-order",
    handler: patchOrderHandler,
    // schema: {
    //   body: {
    //     type: "object",
    //     required: ["orderID"],
    //     properties: {
    //       orderID: {
    //         type: "string"
    //       },
    //       shippingOption: {
    //         type: "array",
    //         items: {
    //           type: "object",
    //           required: ["id", "selected"],
    //           properties: {
    //             id: { type: "string" },
    //             // label: { type: "string" },
    //             // type: { type: "string" },
    //             selected: { type: "boolean" }
    //           },
    //         },
    //       },
    //       shipping_address:{
    //         type: "object",
    //         properties: {
    //           city: { type: "string" },
    //           country_code: { type: "string" },
    //           postal_code: { type: "string" },
    //           state: { type: "string" }
    //         }
    //       }
    //     },
    //   },
    // },
  });
}
