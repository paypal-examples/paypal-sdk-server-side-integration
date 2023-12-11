import { fetch } from "undici";
import { randomUUID } from "crypto";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type {
  OrderSuccessResponseBody,
  OrderSuccessResponseBodyMinimal,
  OrderErrorResponseBody,
  CaptureOrder,
} from "@paypal/paypal-js";
import type { HttpErrorResponse } from "../types/common";

const {
  paypal: { apiBaseUrl },
} = config;

type CaptureOrderRequestBody = NonNullable<
  CaptureOrder["requestBody"]
>["content"]["application/json"];

// the Authorization header is missing from the headers list
type CaptureOrderRequestHeaders = Partial<
  CaptureOrder["parameters"]["header"]
> & {
  Authorization?: string;
};

type CaptureOrderSuccessResponse = {
  status: "ok";
  data: OrderSuccessResponseBody | OrderSuccessResponseBodyMinimal;
  httpStatusCode: 200 | 201;
};

type CaptureOrderErrorResponse = {
  status: "error";
  data: OrderErrorResponseBody;
  httpStatusCode: number;
};

type CaptureOrderOptions = {
  body?: CaptureOrderRequestBody;
  headers: CaptureOrderRequestHeaders;
  orderID: string;
};

export default async function captureOrder(
  orderID: string
): Promise<CaptureOrderSuccessResponse | CaptureOrderErrorResponse> {
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
}: CaptureOrderOptions): Promise<
  CaptureOrderSuccessResponse | CaptureOrderErrorResponse
> {
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
            ? (data as OrderSuccessResponseBodyMinimal)
            : (data as OrderSuccessResponseBody),
        httpStatusCode: response.status,
      } as CaptureOrderSuccessResponse;
    } else {
      return {
        status: "error",
        data,
        httpStatusCode: response.status,
      } as CaptureOrderErrorResponse;
    }
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
