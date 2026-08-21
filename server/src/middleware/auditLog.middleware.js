import { auditService } from "../modules/audit/audit.service.js";

const requestIp = (request) => request.ip || request.socket?.remoteAddress || null;

export const createAuditLogMiddleware = ({ service = auditService, log } = {}) =>
  function auditLog(options = {}) {
    return async function auditLogHandler(request, _response, next) {
      try {
        await service.record({
          actorId: request.user?.id ?? null,
          actorRole: request.user?.role ?? null,
          action: options.action,
          entityType: options.entityType ?? null,
          entityId: typeof options.entityId === "function" ? options.entityId(request) : options.entityId ?? null,
          metadata: {
            requestId: request.id,
            method: request.method,
            path: request.originalUrl,
            ...(typeof options.metadata === "function" ? options.metadata(request) : options.metadata ?? {}),
          },
          ipAddress: requestIp(request),
        });
        return next();
      } catch (error) {
        log?.warn?.({ err: error, requestId: request.id }, "Audit event persistence failed");
        return next();
      }
    };
  };

export const auditLog = createAuditLogMiddleware();
export default auditLog;
