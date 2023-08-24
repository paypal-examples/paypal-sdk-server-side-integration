import { fetch } from "undici";
import config from "../config";
import getAuthToken from "../auth/get-auth-token";

import type { CreateSubscriptionRequestBody } from "@paypal/paypal-js";
import type { CreateSubscriptionResponse } from "./subscription.d";
import {
  CreateHTTPStatusCodeSuccessResponse,
  SubscriptionResponseBody,
} from "./subscription.d";
import type { PaypalApiErrorResponseBody } from "../types/common";
import { HttpErrorResponse } from "../types/common";

export default async function createSubscription(
  body: CreateSubscriptionRequestBody
): Promise<CreateSubscriptionResponse> {
  const { access_token: accessToken } = await getAuthToken();
  const defaultErrorMessage = "FAILED_TO_CREATE_SUBSCRIPTION";

  const {
    paypal: { apiBaseUrl },
  } = config;

  const requestHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v1/billing/subscriptions`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        status: "ok",
        data: data as SubscriptionResponseBody,
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
