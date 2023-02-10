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

interface HttpErrorResponse extends Error {
  statusCode?: number;
}

export default async function patchOrder(
  patchOrderPayload: { shippingOption?: { id: string; label: any; type: any; selected: any; amount: { value: number; currency_code: any; }; }[]; shippingAddress?: ShippingAddress; orderId?: string; amount?: any; selected_shipping_option?: any; }
) {
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
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders`, {
      method: "patch",
      body: JSON.stringify(patchOrderPayload),
    });

    const data = await response.json();

    if (response.status !== 200 && response.status !== 201) {
      const errorData = data as PatchOrderErrorResponse;
      console.log({ errorData, status: response.status });
      const errorMessage = errorData.name
        ? `${errorData.name} - ${errorData.message} (debug_id: ${errorData.debug_id})`
        : defaultErrorMessage;
      throw new Error(errorMessage);
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
