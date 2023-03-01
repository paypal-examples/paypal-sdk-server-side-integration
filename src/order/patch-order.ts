import { fetch } from "undici";
import config from "../config";
import { getOrder } from "./get-order";
import type { ShippingAddress } from "@paypal/paypal-js";
import shippingCost from "../data/shipping-cost.json";

const {
  paypal: { apiBaseUrl },
} = config;

type PatchOrderErrorResponse = {
  [key: string]: unknown;
  name: string;
  message: string;
  debug_id: string;
};

type HttpErrorResponse = {
  statusCode?: number;
  details?: Record<string, string>;
} & Error;

export async function onShippingChange(
  accessToken: string,
  patchOrderPayload: {
    orderID: string;
    shippingAddress: ShippingAddress;
  }
) {
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  if (!patchOrderPayload) {
    throw new Error("MISSING_ORDER_ID_FOR_PATCH_ORDER");
  }

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  let response;
  try {
    //get order details
    const orderDetails = await getOrder(accessToken, patchOrderPayload.orderID);
    //calculate the order amount
    let totalNewAmount = 0;
    const state = patchOrderPayload.shippingAddress
      .state as keyof typeof shippingCost;

    let breakdownShipping = 0;
    if (shippingCost[state] === undefined) {
      breakdownShipping = parseFloat(shippingCost.DEFAULT.price);
    } else {
      breakdownShipping = parseFloat(shippingCost[state].price);
    }
    // total amount should equal item_total + tax_total + shipping + handling + insurance - shipping_discount - discount.
    totalNewAmount =
      parseFloat(
        orderDetails?.purchase_units[0]!.amount!.breakdown!.item_total!.value ??
          "0"
      ) +
      breakdownShipping +
      parseFloat(
        orderDetails?.purchase_units[0]?.amount?.breakdown?.tax_total?.value ??
          "0"
      ) +
      parseFloat(
        orderDetails?.purchase_units[0]?.amount?.breakdown?.handling?.value ??
          "0"
      ) +
      parseFloat(
        orderDetails?.purchase_units[0]?.amount?.breakdown?.insurance?.value ??
          "0"
      ) -
      parseFloat(
        orderDetails?.purchase_units[0]?.amount?.breakdown?.shipping_discount
          ?.value ?? "0"
      ) -
      parseFloat(
        orderDetails?.purchase_units[0]?.amount?.breakdown?.discount?.value ??
          "0"
      );

    orderDetails.purchase_units[0].amount.value = totalNewAmount.toString();
    orderDetails.purchase_units[0].amount.currency_code = "USD";
    orderDetails.purchase_units[0].amount.breakdown!.shipping!.value! =
      breakdownShipping.toString();

    response = await fetch(
      `${apiBaseUrl}/v2/checkout/orders/${patchOrderPayload.orderID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en_US",
        },
        body: JSON.stringify([
          {
            op: "replace",
            path: "/purchase_units/@reference_id=='default'/amount",
            value: orderDetails.purchase_units[0].amount,
          },
        ]),
      }
    );

    //A successful request returns the HTTP 204 No Content status code with an empty object
    if (response.status === 204) {
      return {};
    }

    const data = await response.json();

    const errorData = data as PatchOrderErrorResponse;
    if (!errorData.name) {
      throw new Error(defaultErrorMessage);
    }

    const { name, message, debug_id, details } = errorData;
    const errorMessage = `${name} - ${message} (debug_id: ${debug_id})`;

    const error: HttpErrorResponse = new Error(errorMessage);
    error.details = details as Record<string, string>;
    throw error;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
