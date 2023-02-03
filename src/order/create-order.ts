import { fetch } from "undici";
import config from "../config";

import type { CreateOrderRequestBody } from "@paypal/paypal-js";

const {
  paypal: { apiBaseUrl },
} = config;

type CreateOrderErrorResponse = {
  [key: string]: unknown;
  name: string;
  message: string;
  debug_id: string;
};

interface HttpErrorResponse extends Error {
  statusCode?: number;
}

export default async function createOrder(
  accessToken: string,
  orderPayload: CreateOrderRequestBody
) {
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  if (!orderPayload) {
    throw new Error("MISSING_PAYLOAD_FOR_CREATE_ORDER");
  }

  const defaultErrorMessage = "FAILED_TO_CREATE_ORDER";

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (response.status !== 200 && response.status !== 201) {
      const errorData = data as CreateOrderErrorResponse;
      console.log({ errorData, status: response.status });
      const errorMessage = errorData.name
        ? `${errorData.name} - ${errorData.message} (debug_id: ${errorData.debug_id})`
        : defaultErrorMessage;
      throw new Error(errorMessage);
    }

    // TODO: define type for create order response
    return data;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
