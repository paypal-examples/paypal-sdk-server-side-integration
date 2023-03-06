import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type { OrderResponseBody } from "@paypal/paypal-js";

const {
  paypal: { apiBaseUrl },
} = config;

type GetOrderResponse = {
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

export default async function getOrder(
  orderID: string
): Promise<{ data: OrderResponseBody; httpStatus: number }> {
  if (!orderID) {
    throw new Error("MISSING_ORDER_ID");
  }

  const { access_token: accessToken } = await getAuthToken();

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders/${orderID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
      },
    });

    const data = (await response.json()) as GetOrderResponse;

    return { data, httpStatus: response.status };
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
