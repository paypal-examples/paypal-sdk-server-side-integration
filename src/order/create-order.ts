import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  CreateOrderRequestBody,
  OrderResponseBodyMinimal,
  OrderResponseBody,
} from "@paypal/paypal-js";
import type {
  HttpErrorResponse,
  OrderResponse,
  OrderErrorResponse,
  CreateCaptureHTTPStatusCodeSuccessResponse,
} from "./order";

const {
  paypal: { apiBaseUrl },
} = config;

type CreateOrderRequestHeaders = Partial<{
  "Content-Type": string;
  Authorization: string;
  "Accept-Language": string;
  Prefer: string;
  "PayPal-Request-Id": string;
}>;

type CreateOrderOptions = {
  body: CreateOrderRequestBody;
  headers?: CreateOrderRequestHeaders;
};

export default async function createOrder({
  body,
  headers = {},
}: CreateOrderOptions): Promise<OrderResponse> {
  if (!body) {
    throw new Error("MISSING_PAYLOAD_FOR_CREATE_ORDER");
  }

  const { access_token: accessToken } = await getAuthToken();
  const defaultErrorMessage = "FAILED_TO_CREATE_ORDER";

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "Accept-Language": "en_US",
    Prefer: "return=minimal",
    ...headers,
  };

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        status: "ok",
        data:
          requestHeaders.Prefer === "return=minimal"
            ? (data as OrderResponseBodyMinimal)
            : (data as OrderResponseBody),
        httpStatusCode:
          response.status as CreateCaptureHTTPStatusCodeSuccessResponse,
      };
    } else {
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
