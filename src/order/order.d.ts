import type {
  OrderResponseBodyMinimal,
  OrderResponseBody,
} from "@paypal/paypal-js";
import { PaypalApiErrorResponseBody } from "../types/common";

export type OrderErrorResponse = PaypalApiErrorResponseBody;

type HTTPStatusCodeSuccessResponse = HTTPStatusCodeSuccessResponse;

// for create order and capture order
export type CreateCaptureHTTPStatusCodeSuccessResponse = 200 | 201;

export type OrderRequestHeaders = Partial<{
  "Content-Type": string;
  Authorization: string;
  "Accept-Language": string;
  Prefer: string;
  "PayPal-Request-Id": string;
}>;

export interface OrderResponseSuccess {
  status: "ok";
}

interface CreateCaptureOrderResponseSuccess extends OrderResponseSuccess {
  data: OrderResponseBodyMinimal | OrderResponseBody;
  httpStatusCode: CreateCaptureHTTPStatusCodeSuccessResponse;
}

export type OrderResponseError = {
  status: "error";
  data: OrderErrorResponse;
  httpStatusCode: Omit<number, HTTPStatusCodeSuccessResponse>;
};

export type OrderResponse =
  | CreateCaptureOrderResponseSuccess
  | OrderResponseError;
