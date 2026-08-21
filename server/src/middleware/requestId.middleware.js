import { randomUUID } from "node:crypto";

const SAFE_REQUEST_ID = /^[a-zA-Z0-9._:-]{1,128}$/;

export const requestIdMiddleware = (request, response, next) => {
  const suppliedRequestId = request.get("x-request-id");
  const requestId =
    suppliedRequestId && SAFE_REQUEST_ID.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();

  request.id = requestId;
  response.setHeader("X-Request-ID", requestId);
  next();
};

export default requestIdMiddleware;
