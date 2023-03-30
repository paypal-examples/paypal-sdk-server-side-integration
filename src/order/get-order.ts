import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type { OrderResponseBody } from "@paypal/paypal-js";
import type {
  OrderErrorResponse,
  GetHTTPStatusCodeSuccessResponse,
  GetOrderResponse,
  HttpErrorResponse,
} from "./order";

const {
  paypal: { apiBaseUrl },
} = config;

type GetOrderRequestHeaders = {
  Authorization: string;
  "Content-Type": string;
};

type GetOrderOptions = {
  orderID: string;
  headers?: GetOrderRequestHeaders;
  query?: { fields: string };
};

export default async function getOrder({
  orderID,
  headers,
  query,
}: GetOrderOptions): Promise<GetOrderResponse> {
  if (!orderID) {
    throw new Error("MISSING_ORDER_ID");
  }

  const { access_token: accessToken } = await getAuthToken();

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    ...headers,
  };

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders/${orderID}`, {
      method: "GET",
      headers: requestHeaders,
    });

    const data = (await response.json()) as OrderResponseBody;

    if (response.ok) {
      return {
        status: "ok",
        data: data,
        httpStatusCode: response.status as GetHTTPStatusCodeSuccessResponse,
      };
    } else {
      const data = await response.json();

      return {
        status: "error",
        data: data as OrderErrorResponse,
        httpStatusCode: response.status,
      };
    }
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
