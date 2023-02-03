import { fetch } from "undici";
import config from "../config";

const {
  paypal: { apiBaseUrl },
} = config;

type CaptureOrderErrorResponse = {
  error: string;
  error_description: string;
};

interface HttpErrorResponse extends Error {
  statusCode?: number;
}

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
        },
      }
    );

    const data = await response.json();

    if (response.status !== 200) {
      const errorData = data as CaptureOrderErrorResponse;
      console.log({ errorData });
      const errorMessage = errorData.error
        ? `${errorData.error} - ${errorData.error_description}`
        : defaultErrorMessage;
      throw new Error(errorMessage);
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
