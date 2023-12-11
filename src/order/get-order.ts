import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  OrderSuccessResponseBody,
  OrderErrorResponseBody,
  GetOrder,
} from "@paypal/paypal-js";
import type { HttpErrorResponse } from "../types/common";

const {
  paypal: { apiBaseUrl },
} = config;

// the Authorization header is missing from the headers list
type GetOrderRequestHeaders = Partial<GetOrder["parameters"]["header"]> & {
  Authorization?: string;
};

type GetOrderSuccessResponse = {
  status: "ok";
  data: OrderSuccessResponseBody;
  httpStatusCode: 200;
};

type GetOrderErrorResponse = {
  status: "error";
  data: OrderErrorResponseBody;
  httpStatusCode: number;
};

type GetOrderOptions = {
  orderID: string;
  headers?: GetOrderRequestHeaders;
  query?: GetOrder["parameters"]["query"];
};

export default async function getOrder({
  orderID,
  headers = {},
}: GetOrderOptions): Promise<GetOrderSuccessResponse | GetOrderErrorResponse> {
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

    const data = await response.json();

    if (response.ok) {
      return {
        status: "ok",
        data: data as OrderSuccessResponseBody,
        httpStatusCode: response.status,
      } as GetOrderSuccessResponse;
    } else {
      const data = await response.json();

      return {
        status: "error",
        data: data as OrderErrorResponseBody,
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
