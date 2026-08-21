import { metricsRegistry } from "../observability/metrics.js";

export const createObservabilityMiddleware = ({ registry = metricsRegistry } = {}) =>
  function observability(request, response, next) {
    const startedAt = registry.requestStarted();
    let recorded = false;

    const record = () => {
      if (recorded) return;
      recorded = true;
      registry.requestFinished({
        method: request.method,
        statusCode: response.statusCode,
        startedAt,
      });
    };

    response.once("finish", record);
    response.once("close", record);
    return next();
  };

export const observabilityMiddleware = createObservabilityMiddleware();
export default observabilityMiddleware;
