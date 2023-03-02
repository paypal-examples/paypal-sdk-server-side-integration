import { fetch } from "undici";
import config from "../config";
import getOrder from "./get-order";
import type { ShippingAddress, Address } from "@paypal/paypal-js";
import getAuthToken from "../auth/get-auth-token";

const {
  paypal: { apiBaseUrl },
} = config;

type PatchOrderErrorResponse = {
  [key: string]: unknown;
  name: string;
  message: string;
  debug_id: string;
};

type HttpErrorResponse = {
  statusCode?: number;
  details?: Record<string, string>;
} & Error;

export default async function patchOrder(
  orderId: string,
  patchPayload: any
): Promise<{ data: any; httpStatus: number }> {
  const { access_token: accessToken } = await getAuthToken();
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  if (!patchPayload) {
    throw new Error("MISSING_ORDER_ID_FOR_PATCH_ORDER");
  }

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v2/checkout/orders/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
      },
      body: JSON.stringify(patchPayload),
    });

    const data: any = await response.json();

    // A successful patch API response is 204 No Content, with no data
    return { data, httpStatus: response.status };
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
