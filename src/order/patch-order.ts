import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  PatchOrderRequestBody,
  OrderErrorResponseBody,
  PatchOrder,
} from "@paypal/paypal-js";
import type { HttpErrorResponse } from "../types/common";

const {
  paypal: { apiBaseUrl },
} = config;

// the Authorization header is missing from the headers list
type PatchOrderRequestHeaders = Partial<PatchOrder["parameters"]["header"]> & {
  Authorization?: string;
};

type PatchOrderSuccessResponse = {
  status: "ok";
  data: null;
  httpStatusCode: 204;
};

type PatchOrderErrorResponse = {
  status: "error";
  data: OrderErrorResponseBody;
  httpStatusCode: number;
};

export type PatchOrderResponse =
  | PatchOrderSuccessResponse
  | PatchOrderErrorResponse;

export type PatchOrderOptions = {
  body: PatchOrderRequestBody;
  headers?: PatchOrderRequestHeaders;
  orderID: string;
};

export default async function patchOrder({
  orderID,
  headers,
  body,
}: PatchOrderOptions): Promise<
  PatchOrderSuccessResponse | PatchOrderErrorResponse
> {
  if (!orderID) {
    throw new Error("MISSING_ORDER_ID_FOR_PATCH_ORDER");
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
      method: "PATCH",
      headers: requestHeaders,
      body: JSON.stringify(body),
    });

    if (response.status === 204) {
      // A successful patch API response is an HTTP 204 No Content, with no data
      return {
        status: "ok",
        data: null,
        httpStatusCode: response.status,
      };
    } else {
      const data = await response.json();

      return {
        status: "error",
        data,
        httpStatusCode: response.status,
      } as PatchOrderErrorResponse;
    }
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
