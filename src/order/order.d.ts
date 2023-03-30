import type {
  CreateOrderRequestBody,
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

export type GetHTTPStatusCodeSuccessResponse = 200;

export type PatchHTTPStatusCodeSuccessResponse = 204;

// for create order and capture order
export type CHTTPStatusCodeSuccessResponse = 200 | 201;

export type OrderRequestHeaders = Partial<{
  "Content-Type": string;
  Authorization: string;
  "Accept-Language": string;
  Prefer: string;
  "PayPal-Request-Id": string;
}>;

type OrderResponseTypes =
  | OrderResponseBodyMinimal
  | OrderResponseBody
  | OrderErrorResponse
  | null;
export type OrderSuccessResponseTypes =
  | OrderResponseBodyMinimal
  | OrderResponseBody
  | null;

export type OrderResponse =
  | {
      status: "ok";
      data: OrderResponseBodyMinimal | OrderResponseBody;
      httpStatusCode: CHTTPStatusCodeSuccessResponse;
    }
  | {
      status: "error";
      data: OrderErrorResponse;
      httpStatusCode: Omit<number, HTTPStatusCodeSuccessResponse>;
    };

export type PatchOrderResponse =
  | {
      status: "ok";
      data: null;
      httpStatusCode: PatchHTTPStatusCodeSuccessResponse;
    }
  | {
      status: "error";
      data: OrderErrorResponse;
      httpStatusCode: Omit<number, HTTPStatusCodeSuccessResponse>;
    };

export type GetOrderResponse =
  | {
      status: "ok";
      data: OrderResponseBody;
      httpStatusCode: GetHTTPStatusCodeSuccessResponse;
    }
  | {
      status: "error";
      data: OrderErrorResponse;
      httpStatusCode: Omit<number, HTTPStatusCodeSuccessResponse>;
    };

export type HttpErrorResponse = {
  statusCode?: number;
} & Error;

export type PatchOrderRequestBody = {
  patch_request: PatchRequest[];
};

export type PatchRequest = {
  op: "add" | "remove" | "replace" | "move" | "copy" | "test";
  from?: string;
  path: string;
  value: number | string | boolean | null | object;
};
