import type { FastifyInstance, FastifyError } from "fastify";

type HttpErrorResponse = {
  statusCode: number;
  details?: Record<string, string>;
} & FastifyError;

export function setErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler(function (error, request, reply) {
    this.log.error(error);

    const errorResponse = {
      ...error,
      message: error.message,
      statusCode: error.statusCode || 500,
    } as HttpErrorResponse;

    reply.status(errorResponse.statusCode).send({ ...errorResponse });
  });
}
