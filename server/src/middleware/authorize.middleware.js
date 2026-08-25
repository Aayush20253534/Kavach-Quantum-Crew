import { ApiError } from "../common/errors/ApiError.js";

export const authorize = (...allowedRoles) => (request, _response, next) => {
  if (!request.user) {
    return next(
      ApiError.unauthorized("Authentication required", {
        code: "AUTHENTICATION_REQUIRED",
      }),
    );
  }

  if (!allowedRoles.includes(request.user.role)) {
    return next(
      ApiError.forbidden("You do not have permission to access this resource", {
        code: "ROLE_FORBIDDEN",
      }),
    );
  }

  return next();
};

export default authorize;
