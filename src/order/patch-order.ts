import { fetch } from "undici";
import config from "../config";
import type { ShippingOption } from "../controller/patch-order-controller";

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

export async function onShippingChange(
  accessToken: string,
  patchOrderPayload: {
    selectedShippingOption: ShippingOption;
    orderID: string;
  }
) {
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  if (!patchOrderPayload) {
    throw new Error("MISSING_PAYLOAD_FOR_PATCH_ORDER");
  }

  const defaultErrorMessage = "FAILED_TO_PATCH_ORDER";

  let response;
  const baseAmount = "3";
  try {
    console.log(
      "default shipping price ",
      patchOrderPayload?.selectedShippingOption?.amount?.value
    );
    const newShippingPrice =
      parseFloat(baseAmount) +
      parseFloat(patchOrderPayload?.selectedShippingOption?.amount?.value);
    console.log("calculated shipping price ", newShippingPrice);

    response = await fetch(
      `${apiBaseUrl}/v2/checkout/orders/${patchOrderPayload?.orderID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Accept-Language": "en_US",
        },
        body: JSON.stringify([
          {
            op: "replace",
            path: "/purchase_units/@reference_id=='default'",
            value: {
              amount: { value: newShippingPrice, currency_code: "USD" },
            },
          },
        ]),
      }
    );

    const data = await response.json();

    if (response.status !== 200 && response.status !== 201) {
      const errorData = data as PatchOrderErrorResponse;
      if (!errorData.name) {
        throw new Error(defaultErrorMessage);
      }

      const { name, message, debug_id, details } = errorData;
      const errorMessage = `${name} - ${message} (debug_id: ${debug_id})`;

      const error: HttpErrorResponse = new Error(errorMessage);
      error.details = details as Record<string, string>;
      throw error;
    }

    // TODO: define type for patch order response
    return data;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
