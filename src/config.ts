// add a .env file to your project to set these environment variables
import * as dotenv from "dotenv";
dotenv.config();

function getConfig() {
  return {
    paypal: {
      clientID: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      apiBaseUrl:
        process.env.PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com",
      webBaseUrl: process.env.PAYPAL_WEB_BASE_URL || "https://www.paypal.com",
    },
    braintree: {
      merchantID: process.env.BRAINTREE_MERCHANT_ID,
      publicKey: process.env.BRAINTREE_PUBLIC_KEY,
      privateKey: process.env.BRAINTREE_PRIVATE_KEY,
      environment: process.env.BRAINTREE_ENVIRONMENT || "Sandbox",
    },
  };
}

export default getConfig();
