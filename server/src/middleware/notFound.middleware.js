import { ApiError } from "../common/errors/ApiError.js";

export const notFoundMiddleware = (request, _response, next) => {
  next(
    ApiError.notFound(
      `Route ${request.method} ${request.originalUrl} was not found`,
      {
        code: "ROUTE_NOT_FOUND",
      },
    ),
  );
};

export default notFoundMiddleware;
