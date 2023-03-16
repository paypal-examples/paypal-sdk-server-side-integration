import { test, mock } from "tap";

import buildApp from "./app";

test('the "/api/paypal/create-order" route should error with an empty payload', async (t) => {
  const app = buildApp();

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/paypal/create-order",
      payload: {},
    });
    const responseBody = response.json();

    t.equal(response.statusCode, 400);
    t.equal(
      response.headers["content-type"],
      "application/json; charset=utf-8"
    );
    t.equal(responseBody.message, "body must have required property 'cart'");
  } catch (error: unknown) {
    t.error(error);
  }
});

test('the "/api/paypal/create-order" route should successfully create an order', async (t) => {
  const { default: buildApp } = mock("./app", {
    "./order/create-order": () => ({
      status: "ok",
      data: { id: "mockOrderID" },
      httpStatusCode: 201,
    }),
  });

  const app = buildApp();

  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/paypal/create-order",
      payload: {
        cart: [
          {
            sku: "1blwyeo8",
            quantity: 2,
          },
        ],
      },
    });
    const responseBody = response.json();

    t.equal(response.statusCode, 201);
    t.equal(
      response.headers["content-type"],
      "application/json; charset=utf-8"
    );
    t.same(responseBody, { id: "mockOrderID" });
  } catch (error: unknown) {
    t.error(error);
  }
});
