# Upgrading your Client-side only integration to a Server-side integration

We recommend using a combination of client-side and server-side code to integrate the PayPal Buttons on your e-commerce
website. If you currently have a client-side only PayPal Buttons integration, this page will describe how to update it to the recommended approach. <br/><br/>

# What do I need to change?

To migrate from a client-side to a server-side integration, you will first need to follow these steps:

1. Setup a server-side integration with the [PayPal REST APIs](https://developer.paypal.com/api/rest/).

1. `createOrder` JavaScript callback must be changed to use your server to create and return an order ID using the PayPal
   REST API's.

1. `onApprove` JavaScript callback must be changed to use your server to complete transactions using the PayPal REST APIs.

<br/>

# 1. Setup a server-side integration with the PayPal REST APIs

PayPal REST APIs follow a common integration approach used by other RESTful APIs. For PayPal, you will minimally need to do
the following:

1. Setup a PayPal developer account, if you have not already.

1. Create a PayPal REST application to obtain a Client ID + secret

1. Use the Client ID + secret combination to obtain an OAuth access token

1. Use the OAuth access token to directly make REST calls to the PayPal Order APIs

> **Tip**
>
> Checkout the [Get Started guide](https://developer.paypal.com/api/rest/) to for a quick tutorial on PayPal REST integrations.

<br/>

# 2. Change your `createOrder()` callback

## Current state of client-side integration behavior

With the client-side integration pattern, the SDK `actions` helper takes care of calling the v2 Orders API on your behalf to create a PayPal `order` and return an order ID:

```js
createOrder(data, actions) {
  return actions.order.create({
    purchase_units: [
      {
          amount: {
            value: "88.44",
          },
      }],
  });
}
```

## New state of client + server integration behavior

You will need to replace the client-side code to call your server instead, and then return the order ID created on your server:

```js
createOrder: function (data, actions) {
  return (
      // send your cart info to your server side to create a PayPal Order.
      fetch("/your-server/api/create-paypal-order", {
          method: "POST",
          body: JSON.stringify({
          // BELOW IS EXAMPLE DATA FOR DEMONSTRATION ONLY
            cart: [
              {
                sku: "YOUR_PRODUCT_STOCK_KEEPING_UNIT",
                quantity: "YOUR_PRODUCT_QUANTITY",
              }],
            }),
        })
        .then((response) => response.json())
        // return the PayPal Order ID that you received from the PayPal backend
        .then((order) => order.id)
      );
}
```

### Changes needed to migrate to using server-side integration pattern

To simplify the integration of your e-commerce website with the PayPal v2 Orders API, you can move the order creation process to your server-side. The following steps are required to create an order on the server-side:

1. Obtain an access token to use for PayPal backend API calls. This [video tutorial](https://www.youtube.com/watch?v=HOkkbGSxmp4&t=113s) can walk you through the steps.
2. Pass necessary checkout information from the browser client to your server-side API endpoint.
3. Call the PayPal Orders API from your server-side code and return the order ID in your `createOrder()` callback.
4. If you were assigned a `BN Code` for your integration, be sure to include this value in the `PayPal-Partner-Attribution-Id` header of the server-side Create Order API call.
5. If you are making the server-side Create Order API call on behalf of a connected merchant, you will need to include the [PayPal-Auth-Assertion](https://developer.paypal.com/api/rest/requests/#http-request-headers) header or alternatively, pass the merchant's PayPal Account ID in the [payee](https://developer.paypal.com/docs/api/orders/v2/#orders_create!path=purchase_units/payee/merchant_id&t=request) field of the Create Order `purchase_unit`.

<br/>

**_Helpful diagram highlighting the sequence of events required for a client + server integration for creating and returning an order ID:_**

```mermaid
sequenceDiagram
    actor Buyer
    participant M(HTML) as Partner's HTML Page
    participant M(S) as Partner's Server
    participant PP(SDK) as PayPal JS SDK
    participant PP(ORDER) as PayPal Orders API
    M(HTML)->>PP(SDK): Initialize PayPal Button
    PP(SDK)->>M(HTML): Render PayPal Button
    Buyer->>PP(SDK): Click PayPal Button (start checkout)
    PP(SDK)->>M(HTML): createOrder() callback
    M(HTML)->>M(S): Create Order API call
    M(S)->>PP(ORDER): POST v2/orders
    PP(ORDER)->>M(S): Order Created
    M(S)->>M(HTML): Return Order ID
```

**_Sample Create Order API request:_**

```
curl -v -X POST https://api-m.sandbox.paypal.com/v2/checkout/orders \
-H 'Content-Type: application/json' \
-H 'PayPal-Request-Id: 7b92603e-77ed-4896-8e78-5dea2050476a' \
-H 'Authorization: Bearer 6V7rbVwmlM1gFZKW_8QtzWXqpcwQ6T5vhEGYNJDAAdn3paCgRpdeMdVYmWzgbKSsECednupJ3Zx5Xd-g' \
-H 'PayPal-Partner-Attribution-ID: YOUR_BN_CODE' \
-H 'PayPal-Auth-Assertion: YOUR_PAYPAL_AUTH_ASSERTION_VALUE' \
-d '{
    "intent": "CAPTURE",
    "purchase_units": [
        {
            "description": "Camera Shop",
            "amount": {
                "currency_code": "USD",
                "value": "25.00",
                "breakdown": {
                    "item_total": {
                        "currency_code": "USD",
                        "value": "25.00"
                    }
                }
            },
            "items": [
                {
                    "name": "Camera",
                    "sku": "5158936",
                    "unit_amount": {
                        "currency_code": "USD",
                        "value": "25.00"
                    },
                    "quantity": "1"
                }
            ]
        }
    ],
    "application_context": {
        "return_url": "https://example.com/return",
        "cancel_url": "https://example.com/cancel"
    }
}'
```

<br/><br/>

# 3. Change your `onApprove()` callback

## Current state of client-side integration behavior

With the client-side only integration pattern the `actions` helper handles the capture for you:

```js
onApprove(data, actions) {
    return actions.order.capture()
        .then(function (orderData) {
          // Successful capture!
        })
        .catch(function (err) {
          // Failed capture
    });
}
```

## New state of client + server integration behavior

You will need to replace the client-side code to call your server instead. Your server must implment `capture` or `authorize` REST API calls as appropriate depending on your use case.

NOTE: With a client-side only integration, the `actions` helper passes the order ID under the hood to capture the order. You will now need to manually pass this order ID to your server side to process the relevant `capture` or `authorize` REST calls on your server:

```js
onApprove: function (data, actions) {
    // Pass the PayPal order ID to your server side where you will capture it
    return fetch("/my-server/patch-paypal-order", {
        method: "POST",
        body: JSON.stringify({
          orderID: data.orderID
        })
      })
      .then((response) => response.json())
      .then(function (orderData) {
          // Three cases to handle:
          //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
          //   (2) Other non-recoverable errors -> Show a failure message
          //   (3) Successful transaction -> Show confirmation or thank you

          // This example reads a v2/checkout/orders capture response, propagated from the server
          // You could use a different API or structure for your 'orderData'
          const errorDetail = Array.isArray(orderData.details) && orderData.details[0];

          // Recoverable state, per:
          // https://developer.paypal.com/docs/checkout/integration-features/funding-failure/
          if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED') {
              return actions.restart();
          }

          if (errorDetail) {
              console.error('Sorry, your transaction could not be processed.', errorDetail);
          }

          // Successful capture! For demo purposes:
          console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
      })
      .catch(function (err) {
          // Failed capture
      });
}
```

### Changes needed to migrate to using server-side integration pattern

1. Pass the order ID to your server.

2. Update your client-side code to call actions.restart() when there's an INSTRUMENT_DECLINED error.

3. If you are making the server-side Capture Order or Authorize Order API call on behalf of a connected merchant, and you had included the [PayPal-Auth-Assertion](https://developer.paypal.com/api/rest/requests/#http-request-headers) header in the Create Order API call, then you must also pass the PayPal-Auth-Assertion header in this step as well.

Use code snippet from our [demo page]: (https://developer.paypal.com/demo/checkout/#/pattern/server)

> **Error Handling**
>
> You can use the `actions` helper to automatically restart the PayPal checkout flow for INSTRUMENT_DECLINED errors.

<br/>

# Appendix

## Benefits of using a Server-side Integration

- Secure Authorization with PayPal's API: Use a CLIENT_ID and CLIENT_SECRET to securely call PayPal's API from your server-side code. The CLIENT_SECRET is only known by your server-side code and uniquely identifies your application.
- Secure Order Creation: Keep sensitive data, such as order amount, on the server to prevent tampering by outside actors.

## Best Practices for JS SDK Server-Side Integrations:

1. Your CLIENT_SECRET should never be checked into git. We recommend passing this sensitive value to the web server at runtime as an environment variable. It's common to use a .env file that is ignored by git to load sensitive values like this secret.

To securely store your credentials in your application code, we recommend using a .env file. You can find the relevant libraries for Node.js, PHP, and Python at the following links:

- Node.js: https://github.com/motdotla/dotenv
- PHP: https://github.com/vlucas/phpdotenv
- Python: https://github.com/theskumar/python-dotenv

2. The client credentials auth token returned by `/v1/oauth2/token` API endpoint should never be passed to the browser. Keep this value in memory on the server-side and use it as the Authorization header for all other API calls.  
   Here's an example API call in Node.js that uses the client credentials auth token as the Authorization header for all other API calls:

```js
const encodedClientCredentials = Buffer.from(`${client}:${secret}`).toString(
  "base64"
);

const response = await fetch(`${apiBaseUrl}/v1/oauth2/token`, {
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

// do not expose "data.access_token" to the browser
```

3. Create API endpoints to wrap the PayPal API. These API endpoints should include error handling.

- For errors, include the response body in the API's error response to provide helpful information about the error. For example, when capturing an order, an 'INSTRUMENT_DECLINED' error might be returned in the response body.
- For errors, include the HTTP status code in the API's error response to provide value for troubleshooting purposes. For example, 4xx errors might indicate bad user input, while 5xx errors might indicate internal failures.

# Frequently Asked Questions:

- What is server-side code?

  Server-side code runs securely on a web server and is typically used to communicate with API and Databases. Common server-side languages used to make websites include Node.js, PHP, ASP.NET, Ruby, and Java.
