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
  debug_id?: string;
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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en_US",
          // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
          // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
          // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
          // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
        },
      }
    );

    const data: any = await response.json(); //TODO: define type for capture order response

    return { data, httpStatus: response.status }; // TODO: define type for capture order response
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
