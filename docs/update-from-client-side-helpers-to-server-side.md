# Upgrading your Client-side integration to a Server-side integration

We recommend using server-side code to safely integrate the PayPal Buttons component on your e-commerce website. This page will describe how to update your client-side JavaScript code to integrate with your API endpoints in the `createOrder` and `onApprove` callbacks.

## Know before you code
* [How to Setup a Developer Account](https://www.youtube.com/watch?v=O_9G722SpXQ&t=72s)
* [How to Retrieve an API Access Token (Node.js)](https://www.youtube.com/watch?v=HOkkbGSxmp4&t=113s)
* [How to Integrate PayPal Standard Checkout](https://www.youtube.com/watch?v=MBfJEUGNNs0)

## Benefits of using a Server-side Integration

* Secure Authorization with PayPal's APIs: Use a CLIENT_ID and CLIENT_SECRET to securely consume PayPal's APIs from your server-side code. The CLIENT_SECRET is only known by your server-side code and uniquely identifies your application.
* Secure Order Creation: Keep sensitive data, such as order amount, on the server to prevent tampering by outside actors.

### Creates an order
```diff
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
  <body>
    <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
    <div id="paypal-button-container"></div>
    <script>
      window.paypal
        .Buttons({
          // Set up the order
          createOrder: function (data, actions) {
-           return actions.order.create({
-              purchase_units: [
-                {
-                   amount: {
-                      value: "88.44",
-                    },
-                 }],
-                });
+             return (
+               fetch("/your-server/api/create-paypal-order", {
+                 method: "POST",
+                 // use the "body" param to optionally pass additional order information
+                 // like product skus and quantities
+                 body: JSON.stringify({
+                 // for no itemization of goods, send empty cart(cart:[])
+                 // for itemization of goods, send an array of cart 
+                   cart: [
+                     {
+                        sku: "YOUR_PRODUCT_STOCK_KEEPING_UNIT",
+                        quantity: "YOUR_PRODUCT_QUANTITY",
+                      }],
+                   }),
+                 })
+                 .then((response) => response.json())
+                 // return the PayPal Order ID
+                 .then((order) => order.id)
+               );
            },
            onError: function (err) {
              // For example, redirect to a specific error page
              window.location.href = "/your-error-page-here";
            }
        })
        .render("#paypal-button-container");
    </script>
  </body>
</html>
```
### Captures payment for an order
```diff
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
  <body>
    <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
    <div id="paypal-button-container"></div>
    <script>
      window.paypal
        .Buttons({
            // Finalize the transaction
            onApprove: function (data, actions) {
-             return actions.order
-               .capture()
-               .then(function (orderData) {
-                  // Successful capture!
-                })
-                .catch(function (err) {
-                   // Failed capture
-                });
+                return fetch("/my-server/patch-paypal-order", {
+                  method: "POST",
+                })
+                .then((response) => response.json())
+                .then(function (orderData) {
+                   // Successful capture!
+                })
+                .catch(function (err) {
+                   // Failed capture
+                });
            },
            onError: function (err) {
              // For example, redirect to a specific error page
              window.location.href = "/your-error-page-here";
            }
        })
        .render("#paypal-button-container");
    </script>
  </body>
</html>
```
### Buyer checkout error
If an error prevents buyer checkout, alert the user that an error has occurred with the buttons using the onError callback:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
  <body>
    <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
    <div id="paypal-button-container"></div>
    <script>
      window.paypal
        .Buttons({
          // Set up the order
            onError: function (err) {
              // For example, redirect to a specific error page
              window.location.href = "/your-error-page-here";
            }
        })
        .render("#paypal-button-container");
    </script>
  </body>
</html>
```

- What is server-side code?

  Server-side code runs securely on a web server and is typically used to communicate with APIs and Databases. Here's a list of common server-side languages used to make websites: Node.js, PHP, ASP.NET, Ruby, Java.

- What should I do if I do not have the ability to run server-side code?

  We recommend using one of PayPal's partners to host your website like Wix, GoDaddy, Shopify, and Big Commerce.

## Best Practices for JS SDK Server-Side Integrations:

1. CLIENT_SECRET should never be checked into git. We recommend passing this sensitive value to the web server at runtime as an environment variable. It's common to use a .env file that is ignored by git to load sensitive values like this secret.
Examples:
  - Node.js: https://github.com/motdotla/dotenv
  - PHP: https://github.com/vlucas/phpdotenv
  - Python: https://github.com/theskumar/python-dotenv
2. The client credentials auth token returned by `/v1/oauth2/token` api endpoint should never be passed to the browser. Keep this value in memory on the server-side and use it as the Authorization header for all other api calls.  
Node.js auth token example api call:
```
const encodedClientCredentials = Buffer.from(`${client}:${secret}`).toString("base64");

const response = await fetch(`${apiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Language": "en_US",
      Authorization: `Basic ${encodedClientCredentials}`,
    });
    
const data = await response.json();

// do not expose "data.access_token" to the browser
```

3. Create API endpoints to wrap the PayPal APIs. These API endpoints should include error handling.
  * for errors, reply with the response body since it contains helpful information about the error (ex: 'INSTRUMENT_DECLINED' error when capturing an order)
  * for errors, reply with the http status code since it provides value for troubleshooting purposes (ex: 4xx errors for bad user input vs 5xx errors for internal failures)