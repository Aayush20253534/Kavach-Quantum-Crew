import { ApiError } from "../common/errors/ApiError.js";

const formatIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

const applyValidatedValue = (request, key, value) => {
  if (key === "query") {
    // Express 5 exposes req.query through a getter. Direct assignment such as
    // `request.query = parsed.data` can throw in ESM strict mode and turn every
    // validated GET endpoint into a 500 response.
    //
    // Shadow the prototype accessor with this request's validated query object.
    Object.defineProperty(request, "query", {
      value,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return;
  }

  request[key] = value;
};

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

      applyValidatedValue(request, key, parsed.data);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

export default validate;
