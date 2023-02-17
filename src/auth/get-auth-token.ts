import { fetch } from "undici";
import config from "../config";
import Cache from "./cache";

const {
  paypal: { clientID, clientSecret, apiBaseUrl },
} = config;

const cache = new Cache();

// https://developer.paypal.com/api/rest/authentication/
export type AuthTokenResponse = {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
};

type AuthTokenErrorResponse = {
  error: string;
  error_description: string;
};

interface HttpErrorResponse extends Error {
  statusCode?: number;
}

export default async function getAuthToken(
  client = clientID,
  secret = clientSecret
): Promise<AuthTokenResponse> {
  if (!client || !secret) {
    throw new Error("MISSING_API_CREDENTIALS");
  }

  const cacheKey = `${client}:${secret}`;
  const cacheValue = cache.get(cacheKey);

  if (cacheValue) {
    return Promise.resolve(cacheValue as AuthTokenResponse);
  }

  const defaultErrorMessage = "FAILED_TO_CREATE_ACCESS_TOKEN";

  const encodedClientCredentials = Buffer.from(`${client}:${secret}`).toString(
    "base64"
  );
  let response;
  try {
    response = await fetch(`${apiBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Language": "en_US",
        Authorization: `Basic ${encodedClientCredentials}`,
      },
    });

    const data = await response.json();

    if (response.status !== 200) {
      const errorData = data as AuthTokenErrorResponse;
      const errorMessage = errorData.error
        ? `${errorData.error} - ${errorData.error_description}`
        : defaultErrorMessage;
      throw new Error(errorMessage);
    }

    const authTokenData = data as AuthTokenResponse;
    cache.set(cacheKey, authTokenData, authTokenData.expires_in * 1000);

    return authTokenData;
  } catch (error) {
    const httpError: HttpErrorResponse =
      error instanceof Error ? error : new Error(defaultErrorMessage);
    httpError.statusCode = response?.status;
    throw httpError;
  }
}
