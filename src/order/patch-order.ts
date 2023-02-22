import { fetch } from "undici";
import config from "../config";
import type { ShippingOption } from "../controller/order-controller";
import { retrieveOrder } from "./retrieve-order";

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
  try {
    //retrieve order details
    const orderDetails = await retrieveOrder(
      accessToken,
      patchOrderPayload?.orderID
    );
    //calculate the order amount
    let totalBaseAmount = 0;
    orderDetails?.purchase_units?.map((unit) => {
      const breakdownValue = parseFloat(unit?.amount?.value ?? "0");
      const breakdownShipping = parseFloat(
        unit?.amount?.breakdown?.shipping?.value ?? "0"
      );
      const breakdownShippingDiscount = parseFloat(
        unit?.amount?.breakdown?.shipping_discount?.value ?? "0"
      );
      if (breakdownValue > 0) {
        totalBaseAmount += parseFloat(
          (
            breakdownValue -
            (breakdownShipping - breakdownShippingDiscount)
          ).toFixed(2)
        );
      }
    });

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
              amount: { value: totalBaseAmount, currency_code: "USD" },
            },
          },
        ]),
      }
    );

    //A successful request returns the HTTP 204 No Content status code with an empty object
    if (response.status === 204) {
      return {};
    }

    const data = await response.json();
    const errorData = data as PatchOrderErrorResponse;
    if (!errorData.name) {
      throw new Error(defaultErrorMessage);
    }

    const { name, message, debug_id, details } = errorData;
    const errorMessage = `${name} - ${message} (debug_id: ${debug_id})`;

    const error: HttpErrorResponse = new Error(errorMessage);
    error.details = details as Record<string, string>;
    throw error;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
