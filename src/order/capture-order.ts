import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";
import uuid from "@braintree/uuid";

import type { OrderResponseBody } from "@paypal/paypal-js";

const {
  paypal: { apiBaseUrl },
} = config;

type CaptureOrderResponse = {
  [key: string]: unknown;
  details?: Record<string, string>;
  name?: string;
  message?: string;
  debug_id?: string;
} & OrderResponseBody;

type HttpErrorResponse = {
  statusCode?: number;
  details?: Record<string, string>;
  debug_id?: string;
} & Error;

export default async function captureOrder(
  orderID: string
): Promise<{ data: CaptureOrderResponse; httpStatus: number }> {
  const uniqueRequestId = uuid();
  // Call the API
  let { data, httpStatus } = await captureOrderAPI(orderID, uniqueRequestId);

  // For 5xx capture errors specifically, implement optional idempotent retry https://developer.paypal.com/reference/guidelines/idempotency/
  if (httpStatus >= 500) {
    // sleep 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // retry identical request
    ({ data, httpStatus } = await captureOrderAPI(orderID, uniqueRequestId));
  }

  return { data, httpStatus };
}

async function captureOrderAPI(
  orderID: string,
  uniqueRequestId: string
): Promise<{ data: CaptureOrderResponse; httpStatus: number }> {
  if (!orderID) {
    throw new Error("MISSING_ORDER_ID_FOR_CAPTURE_ORDER");
  }
  const { access_token: accessToken } = await getAuthToken();

  const defaultErrorMessage = "FAILED_TO_CAPTURE_ORDER";

  let response;
  try {
    response = await fetch(
      `${apiBaseUrl}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en_US",
          "PayPal-Request-Id": uniqueRequestId,
          // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
          // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
          // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
        },
      }
    );

    const data = (await response.json()) as CaptureOrderResponse;

    return { data, httpStatus: response.status };
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
