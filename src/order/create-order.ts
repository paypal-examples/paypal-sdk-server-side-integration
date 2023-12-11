import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  CreateOrderRequestBody,
  OrderSuccessResponseBody,
  OrderSuccessResponseBodyMinimal,
  OrderErrorResponseBody,
  CreateOrder,
} from "@paypal/paypal-js";
import type { HttpErrorResponse } from "../types/common";

const {
  paypal: { apiBaseUrl },
} = config;

// the Authorization header is missing from the headers list
type CreateOrderRequestHeaders = Partial<
  CreateOrder["parameters"]["header"]
> & {
  Authorization?: string;
};

type CreateOrderSuccessResponse = {
  status: "ok";
  data: OrderSuccessResponseBody | OrderSuccessResponseBodyMinimal;
  httpStatusCode: 200 | 201;
};

type CreateOrderErrorResponse = {
  status: "error";
  data: OrderErrorResponseBody;
  httpStatusCode: number;
};

type CreateOrderOptions = {
  body: CreateOrderRequestBody;
  headers?: CreateOrderRequestHeaders;
};

export default async function createOrder({
  body,
  headers = {},
}: CreateOrderOptions): Promise<
  CreateOrderSuccessResponse | CreateOrderErrorResponse
> {
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
            ? (data as OrderSuccessResponseBodyMinimal)
            : (data as OrderSuccessResponseBody),
        httpStatusCode: response.status,
      } as CreateOrderSuccessResponse;
    } else {
      return {
        status: "error",
        data,
        httpStatusCode: response.status,
      } as CreateOrderErrorResponse;
    }
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
