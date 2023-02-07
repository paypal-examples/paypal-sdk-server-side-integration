// add a .env file to your project to set these environment variables
import * as dotenv from "dotenv";
dotenv.config();

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET,
  PAYPAL_API_BASE_URL,
  PAYPAL_WEB_BASE_URL,
} = process.env;

function getConfig() {
  return {
    paypal: {
      clientID: PAYPAL_CLIENT_ID,
      clientSecret: PAYPAL_CLIENT_SECRET,
      apiBaseUrl: PAYPAL_API_BASE_URL || "https://api-m.sandbox.paypal.com",
      webBaseUrl: PAYPAL_WEB_BASE_URL || "https://www.paypal.com",
    },
  };
}

export default getConfig();
