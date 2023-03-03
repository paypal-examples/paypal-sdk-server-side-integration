import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  CreateOrderRequestBody,
  OrderResponseBody,
} from "@paypal/paypal-js";

const {
  paypal: { apiBaseUrl },
} = config;

type CreateOrderResponse = {
  [key: string]: unknown;
  details?: Record<string, string>;
  name?: string;
  message?: string;
  debug_id?: string;
} & OrderResponseBody;

type HttpErrorResponse = {
  statusCode?: number;
  details?: Record<string, string>;
} & Error;

export default async function createOrder(
  orderPayload: CreateOrderRequestBody
): Promise<{ data: CreateOrderResponse; httpStatus: number }> {
  if (!orderPayload) {
    throw new Error("MISSING_PAYLOAD_FOR_CREATE_ORDER");
  }

  const { access_token: accessToken } = await getAuthToken();

  const defaultErrorMessage = "FAILED_TO_CREATE_ORDER";

  let response;
  try {
    const SET_BUT_EMPTY = " "; // a single space
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
        "PayPal-Request-Id": SET_BUT_EMPTY, // API requires this header if payment_source.paypal.experience_context is in payload, however it's not applicable to this use case so SET_BUT_EMPTY
      },
      body: JSON.stringify(orderPayload),
    });

    const data = (await response.json()) as CreateOrderResponse;

    return { data, httpStatus: response.status };
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
