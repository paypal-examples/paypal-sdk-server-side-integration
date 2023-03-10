import app from "./app";

const FASTIFY_PORT = Number(process.env.FASTIFY_PORT) || 3006;
const FASTIFY_HOST = process.env.FASTIFY_HOST || "localhost";

app.listen({
  port: FASTIFY_PORT,
  host: FASTIFY_HOST,
});

console.log(`🚀  Fastify server running on port ${FASTIFY_PORT}`);
