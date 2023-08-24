import type { LinkDescription } from "@paypal/paypal-js/types/apis/orders";
import type {
  PaypalApiErrorResponse,
  HTTPStatusCodeSuccessResponse,
} from "../types/common";

export type SubscriptionResponseBody = {
  /**
   * The ID of the Subscription
   * @readonly
   */
  id: string;
  /**
   * The Subscription status
   */
  status:
    | "APPROVAL_PENDING" // The subscription is created but not yet approved by the buyer.
    | "APPROVED" // The buyer has approved the subscription.
    | "ACTIVE" // The subscription is active.
    | "SUSPENDED" // The subscription is suspended.
    | "CANCELLED" // The subscription is cancelled.
    | "EXPIRED"; // The subscription is expired.
  /**
   * An array of request-related HATEOAS links
   */
  links: LinkDescription[];
};

export type CreateHTTPStatusCodeSuccessResponse = 200 | 201;

export interface ResponseSuccess {
  status: "ok";
}

interface CreateSubscriptionResponseSuccess extends ResponseSuccess {
  data: SubscriptionResponseBody;
  httpStatusCode: CreateHTTPStatusCodeSuccessResponse;
}

export type CreateSubscriptionResponseError = {
  status: "error";
  data: PaypalApiErrorResponse;
  httpStatusCode: Omit<number, HTTPStatusCodeSuccessResponse>;
};

export type CreateSubscriptionResponse =
  | CreateSubscriptionResponseSuccess
  | CreateSubscriptionResponseError;
