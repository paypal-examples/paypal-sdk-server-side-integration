import { test, mock } from "tap";

test("should throw an error when clientID is undefined", async (t) => {
  t.plan(1);

  const { default: getAuthToken } = mock("./get-auth-token", {
    "../config": {
      paypal: {
        clientID: null,
        clientSecret: null,
      },
    },
  });

  try {
    await getAuthToken();
  } catch (error: unknown) {
    t.equal((error as Error).message, "MISSING_API_CREDENTIALS");
  }
});

test("should throw an error when clientSecret is undefined", async (t) => {
  t.plan(1);

  const { default: getAuthToken } = mock("./get-auth-token", {
    "../config": {
      paypal: {
        clientID: "mockClientIDValue",
        clientSecret: null,
      },
    },
  });

  try {
    await getAuthToken();
  } catch (error: unknown) {
    t.equal((error as Error).message, "MISSING_API_CREDENTIALS");
  }
});

test("should retrieve access token from cache", async (t) => {
  class CacheMock {
    get(credentials: string) {
      if (credentials === "mockClientIDValue:mockClientSecretValue") {
        return {
          access_token: "mockAccessTokenFromCache",
        };
      }
    }
  }

  const { default: getAuthToken } = mock("./get-auth-token", {
    "./cache": CacheMock,
  });

  const authTokenResponse = await getAuthToken(
    "mockClientIDValue",
    "mockClientSecretValue"
  );
  t.equal(authTokenResponse.access_token, "mockAccessTokenFromCache");
});

test("should retrieve access token from /v1/oauth2/token api ", async (t) => {
  const { default: getAuthToken } = mock("./get-auth-token", {
    undici: {
      fetch() {
        return {
          status: 200,
          json: () => ({ access_token: "mockAccessTokenFromFetch" }),
        };
      },
    },
  });

  const authTokenResponse = await getAuthToken(
    "mockClientIDValue",
    "mockClientSecretValue"
  );
  t.equal(authTokenResponse.access_token, "mockAccessTokenFromFetch");
});

test("should throw an error when /v1/oauth2/token api call fails with known error", async (t) => {
  t.plan(1);

  const { default: getAuthToken } = mock("./get-auth-token", {
    undici: {
      fetch() {
        return {
          status: 401,
          json: () => ({
            error: "invalid_client",
            error_description: "Client Authentication failed",
          }),
        };
      },
    },
  });

  try {
    await getAuthToken("mockClientIDValue", "mockClientSecretValue");
  } catch (error: unknown) {
    t.equal(
      (error as Error).message,
      "invalid_client - Client Authentication failed"
    );
  }
});

test("should throw a default error when /v1/oauth2/token api call fails with unknown error", async (t) => {
  t.plan(1);

  const { default: getAuthToken } = mock("./get-auth-token", {
    undici: {
      fetch() {
        return {
          status: 500,
          json: () => ({}),
        };
      },
    },
  });

  try {
    await getAuthToken("mockClientIDValue", "mockClientSecretValue");
  } catch (error: unknown) {
    t.equal((error as Error).message, "FAILED_TO_CREATE_ACCESS_TOKEN");
  }
});
