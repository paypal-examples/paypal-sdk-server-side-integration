import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  CreateOrderRequestBody,
  OrderResponseBodyMinimal,
  OrderResponseBody,
} from "@paypal/paypal-js";

const {
  paypal: { apiBaseUrl },
} = config;

type HTTPStatusCodeSuccessResponse = 200 | 201;

type CreateOrderErrorResponse = {
  [key: string]: unknown;
  details: Record<string, string>;
  name: string;
  message: string;
  debug_id: string;
};

type CreateOrderResponse =
  | {
      status: "ok";
      data: OrderResponseBodyMinimal | OrderResponseBody;
      httpStatusCode: HTTPStatusCodeSuccessResponse;
    }
  | {
      status: "error";
      data: CreateOrderErrorResponse;
      httpStatusCode: Omit<number, HTTPStatusCodeSuccessResponse>;
    };

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
}: CreateOrderOptions): Promise<CreateOrderResponse> {
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
        httpStatusCode: response.status as HTTPStatusCodeSuccessResponse,
      };
    } else {
      return {
        status: "error",
        data: data as CreateOrderErrorResponse,
        httpStatusCode: response.status,
      };
    }
  } catch (error) {
    type HttpErrorResponse = {
      statusCode?: number;
    } & Error;

    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
