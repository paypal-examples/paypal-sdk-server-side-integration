import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";
import type {
  OrderErrorResponse,
  HttpErrorResponse,
  OrderResponseError,
  OrderResponseSuccess,
} from "./order";

const {
  paypal: { apiBaseUrl },
} = config;

type PatchHTTPStatusCodeSuccessResponse = 204;

type PatchOrderRequestHeaders = {
  "Content-Type": string;
  Authorization: string;
};

type PatchOrderOptions = {
  body: PatchOrderRequestBody;
  headers?: PatchOrderRequestHeaders;
  orderID: string;
};

export type PatchRequest = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  from?: string;
  path: string;
  value: number | string | boolean | null | object;
};

type PatchOrderRequestBody = {
  patch_request: PatchRequest[];
};
interface PatchOrderResponseSuccess extends OrderResponseSuccess {
  data: null;
  httpStatusCode: PatchHTTPStatusCodeSuccessResponse;
}

export type PatchOrderResponse = PatchOrderResponseSuccess | OrderResponseError;

export default async function patchOrder({
  orderID,
  headers,
  body,
}: PatchOrderOptions): Promise<PatchOrderResponse> {
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
      body: JSON.stringify(body.patch_request),
    });

    if (response.status === 204) {
      // A successful patch API response is an HTTP 204 No Content, with no data
      return {
        status: "ok",
        data: null,
        httpStatusCode: response.status as PatchHTTPStatusCodeSuccessResponse,
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
