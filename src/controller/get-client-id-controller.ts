import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import config from "../config";

const {
  paypal: { clientID },
} = config;

export default async function getClientIDController(fastify: FastifyInstance) {
  fastify.get(
    "/get-client-id",
    function (_request: FastifyRequest, reply: FastifyReply) {
      reply.send({ clientID });
    }
  );
}
