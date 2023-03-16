import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import createOrder from "../order/create-order";
import captureOrder from "../order/capture-order";
import getOrder from "../order/get-order";
import patchOrder, { type PatchOrderResponse } from "../order/patch-order";
import products from "../data/products.json";
import shippingCost from "../data/shipping-cost.json";
import config from "../config";

import type {
  CreateOrderRequestBody,
  PurchaseItem,
  ShippingAddress,
} from "@paypal/paypal-js";

const {
  paypal: { currency, intent },
} = config;

type CartItem = {
  sku: keyof typeof products;
  quantity: number;
};

function roundTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getItemsAndTotal(cart: CartItem[]): {
  itemsArray: PurchaseItem[];
  itemTotal: number;
} {
  // API reference: https://developer.paypal.com/docs/api/orders/v2/#orders_create!path=purchase_units/items&t=request
  const itemsArray = cart.map(({ sku, quantity = "1" }) => {
    // If limited inventory applies to your use case, this is normally tracked in a database alongside other product information
    // Static information from data/products.json is used here for demo purposes
    const { name, description, price, category, stock = "1" } = products[sku];
    if (stock < quantity)
      throw new Error(`${name} ${sku} (qty: ${quantity}) is out of stock.`);
    return {
      name,
      sku,
      description,
      category,
      quantity,
      unit_amount: {
        currency_code: currency,
        value: price,
      },
    } as PurchaseItem;
  });

  const itemTotal = itemsArray.reduce(
    (partialSum, item) =>
      partialSum + parseFloat(item.unit_amount.value) * parseInt(item.quantity),
    0
  );

  return { itemsArray, itemTotal: roundTwoDecimals(itemTotal) };
}

async function createOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { cart } = request.body as { cart: CartItem[] };
  const { itemsArray, itemTotal } = getItemsAndTotal(cart);

  // Example shipping and tax calculation
  const shippingTotal = 0;
  const taxTotal = roundTwoDecimals(itemTotal * 0.05);
  const grandTotal = roundTwoDecimals(itemTotal + shippingTotal + taxTotal);

  const invoiceId = "DEMO-INVNUM-" + Date.now(); // An optional transaction field value, use your existing system/business' invoice ID here or generate one sequentially

  const orderPayload: CreateOrderRequestBody = {
    // API reference: https://developer.paypal.com/docs/api/orders/v2/#orders_create
    intent: intent,
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: String(grandTotal),
          breakdown: {
            item_total: {
              // Required when `items` array is also present
              currency_code: currency,
              value: String(itemTotal),
            },
            shipping: {
              // Can be omitted if none
              currency_code: currency,
              value: String(shippingTotal),
            },
            tax_total: {
              // Can be omitted if none
              currency_code: currency,
              value: String(taxTotal),
            },
          },
        },
        items:
          itemsArray /* Line item detail can be seen in the PayPal Checkout by clicking the amount in the upper-right, and is stored in the transaction record */,

        /* invoice_id: invoiceId,  /* Your own unique order #, will be indexed and stored as part of the transaction record and searchable in paypal.com account
                                      (Must be unique, never used for an already *successful* transaction in the receiving account;
                                      payment attempts with the invoice_id of a previously successful transaction are blocked to prevent accidental repeat payment for same thing) */

        // custom_id: "any-arbitrary-metadata-value",  /* Not indexed nor searchable, but value will be returned in all API or webhook responses and visible in the transaction record of *receiving* PayPal account */
      },
    ],

    /*
    payment_source: {
      paypal: {
        experience_context: {
          // If there are no tangible items to be shipped as part of the transaction, you can specify NO_SHIPPING to not collect the payer's shipping address
          // shipping_preference: "NO_SHIPPING",

          // If after the payer's approval at PayPal you are *not* going to capture the Order ID immediately, but rather show final review step(s),
          // set the user_action to CONTINUE (default with JS SDK approval is PAY_NOW). This is a cosmetic change to the wording of the last button at PayPal,
          // so that it reads according to the action your integration performs on return.
          // In summary: if CONTINUE is set here, your onApprove callback should proceed to your own review step that *requires a user action* before capture.
          // user_action: "CONTINUE",
        },
      },
    },
    */
  }; //as CreateOrderRequestBody; //cast needed for payment_source.paypal with paypal-js@5.1.4

  const orderResponse = await createOrder(orderPayload);

  if (orderResponse.status === "ok") {
    const { id, status } = orderResponse.data;
    request.log.info({ id, status }, "order successfully created");
  } else {
    request.log.error(orderResponse.data, "failed to create order");
  }

  reply.code(orderResponse.httpStatusCode as number).send(orderResponse.data);
}

async function captureOrderHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { orderID } = request.body as { orderID: string };

  const { data, httpStatus } = await captureOrder(orderID);

  const transaction =
    data?.purchase_units?.[0]?.payments?.captures?.[0] ||
    data?.purchase_units?.[0]?.payments?.authorizations?.[0];

  if (!transaction?.id || transaction.status === "DECLINED") {
    console.warn(`PayPal API order ${orderID}: capture failed`, data);
  } else {
    console.info(
      `PayPal API order ${orderID}: successful capture`,
      transaction
    );
    const capturedAmount = (<any>transaction?.amount)?.value;

    // Here you can add code to save the PayPal transaction.id in your records, perhaps calling an asynchronous database writer
    // (Most common use case is for your own record's id to be unique and map to the transaction.invoice_id you provided during creation)
    // Your code should validate the captured amount was as expected before doing anything automated for order fulfillment/delivery
    // (If the total was not as expected, you could flag the transacton in your system for manual review--or refund it)
  }

  // Finally, forward a result back to the frontend 'onApprove' callback--always forward a result, since the frontend must handle success/failure display
  reply.code(httpStatus).send(data);
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
              required: ["sku"],
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

export async function captureOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/capture-order",
    handler: captureOrderHandler,
    schema: {
      body: {
        type: "object",
        required: ["orderID"],
        properties: {
          orderID: {
            type: "string",
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

// Return the shipping cost for an address (can be "0"), or false to reject shipping to that address
function calcShipping(address: ShippingAddress): string | boolean {
  const prices = shippingCost as {
    [key: string]: { [key: string]: string | boolean };
  };
  const country = address?.country_code;
  const state = address?.state;
  return (
    prices?.[country]?.[state] ??
    prices?.[country]?.DEFAULT ??
    prices?.DEFAULT?.DEFAULT ??
    "0"
  );
}

async function onShippingChange(
  orderID: string,
  shippingAddress: ShippingAddress
): Promise<PatchOrderResponse> {
  if (!orderID) {
    throw new Error("MISSING_ORDER_ID_FOR_PATCH_ORDER");
  }

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  const patchOps: any = [];
  // get the current details
  const orderDetails = (await getOrder(orderID)).data;

  // Loop over the order purchase_units array; most use cases should only have one
  orderDetails?.purchase_units?.forEach((pu, idx) => {
    const reference_id = pu.reference_id || "default";

    // Use payer's shipping address to calculate a new shipping amount
    const shipping = calcShipping(shippingAddress);
    if (shipping === false)
      throw new Error(
        `No shipping to ${JSON.stringify(pu?.shipping?.address, null, 2)}`
      );
    pu!.amount!.breakdown!.shipping = {
      value: shipping.toString(),
      currency_code: pu.amount.currency_code || "USD",
    };

    /* Similarly you could have a new tax calculation, etc
    const taxTotal = calcTaxFunctionHere(shippingAddress);
    pu!.amount!.breakdown!.tax_total = {
      value: taxTotal.toString();
      currency_code: pu.amount.currency_code || "USD",
    };
    */

    // Finally sum up the breakdown object's values to set the top level total
    const grandTotal = Object.entries(pu!.amount!.breakdown!).reduce(
      (partialSum, [bdName, bdValue]) => {
        if (bdName.includes("discount")) {
          return partialSum - parseFloat(bdValue.value) * 100;
        } else {
          return partialSum + parseFloat(bdValue.value);
        }
      },
      0
    );
    pu!.amount!.value = roundTwoDecimals(grandTotal).toString();

    patchOps.push({
      op: "replace",
      path: `/purchase_units/@reference_id=='${reference_id}'/amount`,
      value: pu.amount,
    });
  }); // loop over next purchase_unit, if there is one (rare use case)

  return patchOrder(orderID, patchOps);
}

async function patchOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { orderID, shippingAddress } = request.body as {
    orderID: string;
    shippingAddress: ShippingAddress;
  };

  const patchOrderResponse = await onShippingChange(orderID, shippingAddress);

  if (patchOrderResponse.status === "ok") {
    request.log.info("order successfully patched");
  } else {
    request.log.error(patchOrderResponse.data, "failed to patch order");
  }

  reply
    .code(patchOrderResponse.httpStatusCode as number)
    .send(patchOrderResponse.data);
}

export async function patchOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "PATCH",
    url: "/patch-order",
    handler: patchOrderHandler,
    schema: {
      body: {
        type: "object",
        required: ["orderID"],
        properties: {
          orderID: {
            type: "string",
          },
        },
      },
    },
  });
}

//get order details
async function getOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const { orderID } = request.body as { orderID: string };
  const { data } = await getOrder(orderID);
  reply.send(data);
}

export async function getOrderController(fastify: FastifyInstance) {
  fastify.route({
    method: "GET",
    url: "/get-order",
    handler: getOrderHandler,
    schema: {
      querystring: {
        orderID: { type: "string" },
      },
    },
  });
}
