import { fetch } from "undici";
import config from "../config";

const {
  paypal: { apiBaseUrl },
} = config;

type CaptureOrderErrorResponse = {
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

export default async function captureOrder(
  accessToken: string,
  orderId: string
) {
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  if (!orderId) {
    throw new Error("MISSING_ORDER_ID_FOR_CAPTURE_ORDER");
  }

  const defaultErrorMessage = "FAILED_TO_CAPTURE_ORDER";

  let response;
  try {
    response = await fetch(
      `${apiBaseUrl}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en_US",
          // uncomment this to force an error for negative testing
          // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
          // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
        },
      }
    );

    const data = await response.json();

    if (response.status !== 200 && response.status !== 201) {
      const errorData = data as CaptureOrderErrorResponse;

      if (!errorData.name) {
        throw new Error(defaultErrorMessage);
      }

      const { name, message, debug_id, details } = errorData;
      const errorMessage = `${name} - ${message} (debug_id: ${debug_id})`;

      const error: HttpErrorResponse = new Error(errorMessage);
      error.details = details;
      throw error;
    }

    // TODO: define type for capture order response
    return data;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
