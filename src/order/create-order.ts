import { fetch } from "undici";
import config from "../config";

import type { CreateOrderRequestBody } from "@paypal/paypal-js";

const {
  paypal: { apiBaseUrl },
} = config;

type CreateOrderResponse = {
  id: string;
  status: string;
  links: {
    href: string;
    rel: string;
    method: string;
  }[];
};

type CreateOrderErrorResponse = {
  [key: string]: unknown;
  details: Record<string, string>;
  name: string;
  message: string;
  debug_id: string;
};

type HttpErrorResponse = {
  statusCode?: number;
  details?: Record<string, string>;
} & Error;

export default async function createOrder(
  accessToken: string,
  orderPayload: CreateOrderRequestBody
): Promise<CreateOrderResponse> {
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

      if (!errorData.name) {
        throw new Error(defaultErrorMessage);
      }

      const { name, message, debug_id, details } = errorData;
      const errorMessage = `${name} - ${message} (debug_id: ${debug_id})`;

      const error: HttpErrorResponse = new Error(errorMessage);
      error.details = details;
      throw error;
    }

    return data as CreateOrderResponse;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
