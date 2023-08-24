import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import {
  ActivateSubscriptionResponse,
  CreateHTTPStatusCodeSuccessResponse,
} from "./subscription.d";
import type { PaypalApiErrorResponseBody } from "../types/common";
import { HttpErrorResponse } from "../types/common";

type ActivateSubscriptionOptions = {
  subscriptionId: string;
  reason: string;
};

export default async function activateSubscription({
  subscriptionId,
  reason,
}: ActivateSubscriptionOptions): Promise<ActivateSubscriptionResponse> {
  const { access_token: accessToken } = await getAuthToken();
  const defaultErrorMessage = "FAILED_TO_ACTIVATE_SUBSCRIPTION";

  const {
    paypal: { apiBaseUrl },
  } = config;

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  let response;
  try {
    response = await fetch(
      `${apiBaseUrl}/v1/billing/subscriptions/${subscriptionId}/activate`,
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({ reason }),
      }
    );

    const data =
      response.status === 204 ? await response.text() : await response.json();

    if (response.ok) {
      return {
        status: "ok",
        httpStatusCode: response.status as CreateHTTPStatusCodeSuccessResponse,
      };
    } else {
      return {
        status: "error",
        data: data as PaypalApiErrorResponseBody,
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
