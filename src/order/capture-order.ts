import { fetch } from "undici";
import { randomUUID } from "crypto";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  OrderResponseBody,
  OrderResponseBodyMinimal,
} from "@paypal/paypal-js";
import type {
  HttpErrorResponse,
  CreateCaptureHTTPStatusCodeSuccessResponse,
  OrderErrorResponse,
  OrderResponse,
} from "./order";

const {
  paypal: { apiBaseUrl },
} = config;

type CaptureOrderRequestBody = {
  [key: string]: unknown;
  payment_source?: { [key: string]: unknown };
};

type CaptureOrderRequestHeaders = Partial<{
  "PayPal-Auth-Assertion": string;
  "PayPal-Client-Metadata-Id": string;
  "PayPal-Request-Id": string;
  Prefer: string;
  Authorization: string;
  "Content-Type": string;
}>;

type CaptureOrderOptions = {
  body?: CaptureOrderRequestBody;
  headers: CaptureOrderRequestHeaders;
  orderID: string;
};

export default async function captureOrder(
  orderID: string
): Promise<OrderResponse> {
  const uniqueRequestId: string = randomUUID();
  // Call the API
  let responseData = await captureOrderAPI({
    headers: {
      "PayPal-Request-Id": uniqueRequestId,
      Prefer: "return=representation",
    },
    orderID,
  });
  // For 5xx capture errors specifically, implement optional idempotent retry https://developer.paypal.com/reference/guidelines/idempotency/
  if ((responseData.httpStatusCode as number) >= 500) {
    // sleep 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // retry identical request
    responseData = await captureOrderAPI({
      headers: { "PayPal-Request-Id": uniqueRequestId },
      orderID,
    });
  }
  return responseData;
}

async function captureOrderAPI({
  orderID,
  body,
  headers,
}: CaptureOrderOptions): Promise<OrderResponse> {
  if (!orderID) {
    throw new Error("MISSING_ORDER_ID_FOR_CAPTURE_ORDER");
  }
  const { access_token: accessToken } = await getAuthToken();

  const defaultErrorMessage = "FAILED_TO_CAPTURE_ORDER";

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
    // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
    // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
    // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
    ...headers,
  };

  let response;
  try {
    response = await fetch(
      `${apiBaseUrl}/v2/checkout/orders/${orderID}/capture`,
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(body),
      }
    );

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
