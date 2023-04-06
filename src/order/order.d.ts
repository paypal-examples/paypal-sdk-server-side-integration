import type {
  OrderResponseBodyMinimal,
  OrderResponseBody,
} from "@paypal/paypal-js";

export type OrderErrorResponse = {
  [key: string]: unknown;
  details: Record<string, string>;
  name: string;
  message: string;
  debug_id: string;
};

type HTTPStatusCodeSuccessResponse = 200 | 201 | 204 | 207;

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

export type HttpErrorResponse = {
  statusCode?: number;
} & Error;
