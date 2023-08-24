export type HTTPStatusCodeSuccessResponse = 200 | 201 | 204 | 207;

export type PaypalApiErrorResponseBody = {
  [key: string]: unknown;
  details: Record<string, string>;
  name: string;
  message: string;
  debug_id: string;
};

export type HttpErrorResponse = {
  statusCode?: number;
} & Error;
