import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

const {
  paypal: { apiBaseUrl },
} = config;

type HTTPStatusCodeSuccessResponse = 204;

type PatchOrderErrorResponse = {
  [key: string]: unknown;
  details: Record<string, string>;
  name: string;
  message: string;
  debug_id: string;
};

type HttpErrorResponse = {
  statusCode?: number;
  details?: Record<string, string>;
} & Error;

export type PatchOrderResponse =
  | {
      status: "ok";
      data: null;
      httpStatusCode: HTTPStatusCodeSuccessResponse;
    }
  | {
      status: "error";
      data: PatchOrderErrorResponse;
      httpStatusCode: Omit<number, HTTPStatusCodeSuccessResponse>;
    };

export default async function patchOrder(
  orderID: string,
  patchPayload: any
): Promise<PatchOrderResponse> {
  if (!orderID) {
    throw new Error("MISSING_ORDER_ID_FOR_PATCH_ORDER");
  }

  const { access_token: accessToken } = await getAuthToken();

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders/${orderID}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
      },
      body: JSON.stringify(patchPayload),
    });

    if (response.status === 204) {
      // A successful patch API response is an HTTP 204 No Content, with no data
      return {
        status: "ok",
        data: null,
        httpStatusCode: response.status as HTTPStatusCodeSuccessResponse,
      };
    } else {
      const data = await response.json();

      return {
        status: "error",
        data: data as PatchOrderErrorResponse,
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
