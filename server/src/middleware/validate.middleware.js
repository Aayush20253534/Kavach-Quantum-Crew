import { ApiError } from "../common/errors/ApiError.js";

const formatIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

export const validate = (schemas = {}) => (request, _response, next) => {
  try {
    for (const key of ["params", "query", "body"]) {
      const schema = schemas[key];
      if (!schema) continue;

      const parsed = schema.safeParse(request[key]);
      if (!parsed.success) {
        return next(
          ApiError.badRequest("Validation failed", {
            code: "VALIDATION_ERROR",
            details: formatIssues(parsed.error.issues),
          }),
        );
      }
      request[key] = parsed.data;
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default validate;
