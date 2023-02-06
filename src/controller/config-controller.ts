import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import config from "../config";

const {
  paypal: { clientID },
} = config;

export async function clientIDController(fastify: FastifyInstance) {
  fastify.get(
    "/client-id",
    function (_request: FastifyRequest, reply: FastifyReply) {
      reply.send({ clientID });
    }
  );
}
