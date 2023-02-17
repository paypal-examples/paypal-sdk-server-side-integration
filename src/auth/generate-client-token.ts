import { fetch } from "undici";
import config from "../config";
import Cache from "./cache";

const {
  paypal: { apiBaseUrl },
} = config;

const cache = new Cache();

type TokenErrorResponse = {
  error: string;
  error_description: string;
};

// https://developer.paypal.com/docs/checkout/advanced/integrate/#link-generateclienttoken
export type ClientTokenResponse = {
  client_token: string;
  expires_in: number;
};

interface HttpErrorResponse extends Error {
  statusCode?: number;
}

export default async function generateClientToken(
  accessToken: string
): Promise<ClientTokenResponse> {
  if (!accessToken) {
    throw new Error("MISSING_ACCESS_TOKEN");
  }

  const cacheKey = accessToken;
  const cacheValue = cache.get(cacheKey);

  if (cacheValue) {
    return Promise.resolve(cacheValue as ClientTokenResponse);
  }

  const defaultErrorMessage = "FAILED_TO_GENERATE_CLIENT_TOKEN";

  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v1/identity/generate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "en_US",
      },
    });

    const data = await response.json();

    if (response.status !== 200) {
      const errorData = data as TokenErrorResponse;
      console.log({ errorData });
      const errorMessage = errorData.error
        ? `${errorData.error} - ${errorData.error_description}`
        : defaultErrorMessage;
      throw new Error(errorMessage);
    }

    const clientTokenData = data as ClientTokenResponse;
    cache.set(cacheKey, clientTokenData, clientTokenData.expires_in * 1000);

    return clientTokenData;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
