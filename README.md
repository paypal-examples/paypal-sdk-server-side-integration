# PayPal SDK Server-side Integration

Node.js web server for testing the PayPal and Braintree SDK integrations. Build with the [Fastify web framework](https://www.fastify.io/).

## Quick Start

Create a .env file in this project's root directory. This .env file will store API secrets and securely pass them to the Node.js web server as environment variables at runtime. This .env file should never be checked into git version control. Use the following format:

```bash
PAYPAL_CLIENT_ID=<YOUR_PAYPAL_CLIENT_ID>
PAYPAL_CLIENT_SECRET=<YOUR_PAYPAL_CLIENT_SECRET>
PAYPAL_API_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEB_BASE_URL=https://www.paypal.com
```

This application requires Node.js version 16.8.0 or higher.  Please ensure you have installed and enabled the correct version.

Then install dependencies and start the local web server:

```bash
npm install
npm run dev
```

Component html pages:
- http://localhost:3006/public/buttons.html
- http://localhost:3006/public/hosted-fields.html
