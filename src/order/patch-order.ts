import { fetch } from "undici";
import config from "../config";

import type { CreateOrderRequestBody, ShippingAddress } from "@paypal/paypal-js";

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
  patchOrderPayload: { shippingOption?: { id: string; label: any; type: any; selected: any; amount: { value: number; currency_code: any; }; }[]; shippingAddress?: ShippingAddress; orderID?: string; amount?: any; selected_shipping_option?: any; }
) {
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  if (!patchOrderPayload) {
    throw new Error("MISSING_PAYLOAD_FOR_PATCH_ORDER");
  }

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  let response;
  let baseAmount = "3";
  try {
    patchOrderPayload.amount.value =
          parseFloat(baseAmount) +
          parseFloat(patchOrderPayload.selected_shipping_option.amount.value);
          console.log(apiBaseUrl, patchOrderPayload.orderID)
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders/${patchOrderPayload.orderID}`, {
      method: "patch",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
      },
      // body: JSON.stringify(patchOrderPayload),
      body: JSON.stringify([ { "op": "replace", "path": "/purchase_units/@reference_id==PUHF/selected/shipping/option", "value": {patchOrderPayload} } ])

    });

    const data = await response.json();

    if (response.status !== 200 && response.status !== 201) {
      const errorData = data as PatchOrderErrorResponse;
      if (!errorData.name) {
        throw new Error(defaultErrorMessage);
      }

      const { name, message, debug_id, details } = errorData;
      const errorMessage = `${name} - ${message} (debug_id: ${debug_id})`;

      const error: HttpErrorResponse = new Error(errorMessage);
      error.details = details as Record<string, string>;
      throw error;
    }

    // TODO: define type for patch order response
    return data;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
