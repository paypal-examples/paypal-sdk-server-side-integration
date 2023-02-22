import { fetch } from "undici";
import config from "../config";
import type { OrderResponseBody } from "@paypal/paypal-js";

const {
  paypal: { apiBaseUrl },
} = config;

type getOrderErrorResponse = {
  [key: string]: unknown;
  name: string;
  message: string;
  debug_id: string;
};

type HttpErrorResponse = {
  statusCode?: number;
  details?: Record<string, string>;
} & Error;

export async function getOrder(accessToken: string, orderID: string) {
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  if (!orderID) {
    throw new Error("MISSING_ORDER_ID");
  }

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders/${orderID}`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
      },
    });

    const data: OrderResponseBody | getOrderErrorResponse | unknown =
      await response.json();

    if (response.status !== 200 && response.status !== 201) {
      const errorData = data as getOrderErrorResponse;
      if (!errorData.name) {
        throw new Error(defaultErrorMessage);
      }

      const { name, message, debug_id, details } = errorData;
      const errorMessage = `${name} - ${message} (debug_id: ${debug_id})`;

      const error: HttpErrorResponse = new Error(errorMessage);
      error.details = details as Record<string, string>;
      throw error;
    }

    // TODO: define type for retrieve order response
    return data as OrderResponseBody;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
