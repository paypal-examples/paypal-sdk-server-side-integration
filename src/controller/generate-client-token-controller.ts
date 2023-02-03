import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import getAuthToken from "../auth/get-auth-token";
import generateClientToken from "../auth/generate-client-token";

export default async function clientTokenController(fastify: FastifyInstance) {
  fastify.get(
    "/generate-client-token",
    async function (_request: FastifyRequest, reply: FastifyReply) {
      const { access_token: accessToken } = await getAuthToken();
      const data = await generateClientToken(accessToken);
      reply.send(data);
    }
  );
}
