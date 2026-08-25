import { environment } from "../../config/environment.js";
import { logger } from "../../config/logger.js";

const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const appUrl = (config) => String(config.PUBLIC_APP_URL || "http://localhost:5173").replace(/\/$/, "");

const loginLink = (config, destination, role) => {
  const redirect = encodeURIComponent(destination);
  const roleQuery = role ? `&role=${encodeURIComponent(role)}` : "";
  return `${appUrl(config)}/login?redirect=${redirect}${roleQuery}`;
};

const incidentDestination = (incidentId) => `/disaster-management/incidents/${incidentId}`;
const dispatchDestination = (dispatchId) => `/emergency-services/dispatches/${dispatchId}`;

export const createEmergencyEmailService = ({
  config = environment,
  fetchImpl = globalThis.fetch,
  log = logger,
} = {}) => {
  const send = async ({ to, name, subject, textContent, htmlContent, context }) => {
    if (!to) return { skipped: true, reason: "NO_RECIPIENT" };
    if (!config.BREVO_API_KEY || !config.BREVO_SENDER_EMAIL || typeof fetchImpl !== "function") {
      log.warn({ context, to }, "Emergency email skipped because Brevo is not configured");
      return { skipped: true, reason: "EMAIL_PROVIDER_NOT_CONFIGURED" };
    }

    try {
      const response = await fetchImpl(BREVO_EMAIL_ENDPOINT, {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": config.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: config.BREVO_SENDER_NAME || "QuantumCrew",
            email: config.BREVO_SENDER_EMAIL,
          },
          to: [{ email: to, name: name || to }],
          subject,
          textContent,
          htmlContent,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        log.error(
          { context, to, status: response.status, providerMessage: payload?.message },
          "Emergency email delivery failed",
        );
        return { delivered: false, reason: "EMAIL_DELIVERY_FAILED" };
      }
      return { delivered: true, messageId: payload?.messageId ?? null };
    } catch (error) {
      log.error({ err: error, context, to }, "Emergency email delivery failed");
      return { delivered: false, reason: "EMAIL_DELIVERY_FAILED" };
    }
  };

  return Object.freeze({
    async incidentCreated({ recipients, incident }) {
      const destination = incidentDestination(incident.id);
      const link = loginLink(config, destination, "DISASTER_MANAGER");
      const source = incident.sourceType === "SOS" ? "SOS" : "incident";
      const subject = `${source === "SOS" ? "URGENT SOS" : "New incident"}: ${incident.title}`;
      const locationText =
        incident.latitude != null && incident.longitude != null
          ? `${incident.latitude}, ${incident.longitude}`
          : "Location unavailable";

      return Promise.all(
        recipients.map((recipient) =>
          send({
            to: recipient.email,
            name: recipient.name,
            subject,
            context: { kind: "INCIDENT_CREATED", incidentId: incident.id },
            textContent:
              `A new ${source} has been received by Disaster Management.\n` +
              `Title: ${incident.title}\nSeverity: ${incident.severity}\nLocation: ${locationText}\n\n` +
              `Open incident: ${link}\n\nIf you are not logged in, the link opens login first and then returns to this incident.`,
            htmlContent: `
              <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0f172a">
                <h2 style="margin:0 0 12px">${source === "SOS" ? "Urgent SOS received" : "New emergency incident"}</h2>
                <p><strong>${escapeHtml(incident.title)}</strong></p>
                <p>Severity: <strong>${escapeHtml(incident.severity)}</strong><br/>Location: ${escapeHtml(locationText)}</p>
                ${incident.description ? `<p>${escapeHtml(incident.description)}</p>` : ""}
                <p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px">Open incident</a></p>
                <p style="font-size:13px;color:#64748b">If you are not signed in, KAVACH will ask you to log in and then redirect you to this incident.</p>
              </div>`,
          }),
        ),
      );
    },

    async dispatchAssigned({ account, dispatch, autoAssigned = false }) {
      if (!account?.email) return { skipped: true, reason: "NO_RECIPIENT" };
      const destination = dispatchDestination(dispatch.id);
      const link = loginLink(config, destination, account.serviceType);
      const method = autoAssigned ? "automatically assigned" : "assigned by Disaster Management";
      const incident = dispatch.incident;
      const locationText =
        incident?.latitude != null && incident?.longitude != null
          ? `${incident.latitude}, ${incident.longitude}`
          : "Location unavailable";

      return send({
        to: account.email,
        name: account.organization || account.name,
        subject: `New ${account.serviceType.toLowerCase()} dispatch: ${incident?.title || dispatch.id}`,
        context: { kind: "DISPATCH_ASSIGNED", dispatchId: dispatch.id, accountId: account.id },
        textContent:
          `A new emergency dispatch has been ${method}.\n` +
          `Service: ${account.serviceType}\nIncident: ${incident?.title || dispatch.incidentId}\n` +
          `Severity: ${incident?.severity || "Unknown"}\nLocation: ${locationText}\n\n` +
          `Open dispatch: ${link}\n\nIf you are not logged in, the link opens login first and then returns to this dispatch.`,
        htmlContent: `
          <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0f172a">
            <h2 style="margin:0 0 12px">New ${escapeHtml(account.serviceType)} dispatch</h2>
            <p>This emergency was <strong>${escapeHtml(method)}</strong>.</p>
            <p><strong>${escapeHtml(incident?.title || "Emergency incident")}</strong><br/>Severity: ${escapeHtml(incident?.severity || "Unknown")}<br/>Location: ${escapeHtml(locationText)}</p>
            <p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px">Open dispatch</a></p>
            <p style="font-size:13px;color:#64748b">If you are not signed in, KAVACH will ask you to log in and then redirect you to this dispatch.</p>
          </div>`,
      });
    },
  });
};

export const emergencyEmailService = createEmergencyEmailService();
export default emergencyEmailService;
