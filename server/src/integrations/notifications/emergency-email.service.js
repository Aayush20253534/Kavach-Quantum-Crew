import { environment } from "../../config/environment.js";
import { logger } from "../../config/logger.js";
import { isMailjetConfigured, sendMailjetEmail } from "./mailjet.client.js";

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

const incidentDestination = (incidentId) => `/authority/incidents/${incidentId}`;
const dispatchDestination = (dispatchId) => `/responder/dispatch?dispatch=${encodeURIComponent(dispatchId)}`;

export const createEmergencyEmailService = ({
  config = environment,
  fetchImpl = globalThis.fetch,
  log = logger,
} = {}) => {
  const send = async ({ to, name, subject, textContent, htmlContent, context }) => {
    if (!to) return { skipped: true, reason: "NO_RECIPIENT" };
    if (!isMailjetConfigured(config) || typeof fetchImpl !== "function") {
      log.warn({ context, to }, "Emergency email skipped because Mailjet is not configured");
      return { skipped: true, reason: "EMAIL_PROVIDER_NOT_CONFIGURED" };
    }

    try {
      const result = await sendMailjetEmail({
        to,
        name: name || to,
        subject,
        textContent,
        htmlContent,
        config,
        fetchImpl,
      });
      return { delivered: true, messageId: result.messageId };
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
      const touristName = incident.tourist?.name || "Unknown tourist";
      const touristPhone = incident.tourist?.phone || "Phone unavailable";
      const touristEmail = incident.tourist?.email || "Email unavailable";

      return Promise.all(
        recipients.map((recipient) =>
          send({
            to: recipient.email,
            name: recipient.name,
            subject,
            context: { kind: "INCIDENT_CREATED", incidentId: incident.id },
            textContent:
              `A new ${source} has been received by Disaster Management.\n` +
              `Title: ${incident.title}\nSeverity: ${incident.severity}\n` +
              `Tourist: ${touristName}\nPhone: ${touristPhone}\nEmail: ${touristEmail}\nLocation: ${locationText}\n\n` +
              `Open incident: ${link}\n\nIf you are not logged in, the link opens login first and then returns to this incident.`,
            htmlContent: `
              <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0f172a">
                <h2 style="margin:0 0 12px">${source === "SOS" ? "Urgent SOS received" : "New emergency incident"}</h2>
                <p><strong>${escapeHtml(incident.title)}</strong></p>
                <p>Severity: <strong>${escapeHtml(incident.severity)}</strong><br/>Tourist: <strong>${escapeHtml(touristName)}</strong><br/>Phone: <strong>${escapeHtml(touristPhone)}</strong><br/>Email: ${escapeHtml(touristEmail)}<br/>Location: ${escapeHtml(locationText)}</p>
                ${incident.description ? `<p>${escapeHtml(incident.description)}</p>` : ""}
                <p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px">Open incident</a></p>
                <p style="font-size:13px;color:#64748b">If you are not signed in, KAVACH will ask you to log in and then redirect you to this incident.</p>
              </div>`,
          }),
        ),
      );
    },

    async dangerZoneEntered({ recipient, incident }) {
      if (!recipient?.email) return { skipped: true, reason: "NO_RECIPIENT" };
      const destination = `/tourist/tracking`;
      const link = loginLink(config, destination, "TOURIST");
      return send({
        to: recipient.email,
        name: recipient.name,
        subject: `Danger zone alert: ${incident.title}`,
        context: { kind: "DANGER_ZONE_ENTRY", incidentId: incident.id, userId: recipient.id },
        textContent: `KAVACH detected that you entered a danger zone during an active trip.\n${incident.title}\n\nOpen live safety tracking: ${link}`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0f172a"><h2>Danger zone alert</h2><p><strong>${escapeHtml(incident.title)}</strong></p><p>Your live location entered a high-risk safety zone. Disaster Management has also been notified.</p><p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#be123c;color:#fff;text-decoration:none;border-radius:6px">Open live safety tracking</a></p></div>`,
      });
    },

    async soloSignalLossAlert({ tourist, trip, alert }) {
      if (!tourist?.email) return { skipped: true, reason: "NO_RECIPIENT" };
      const destination = `/tourist/trips/current`;
      const link = loginLink(config, destination, "TOURIST");
      const deadline = alert?.details?.responseDeadlineAt
        ? new Date(alert.details.responseDeadlineAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
        : "within 5 minutes";
      return send({
        to: tourist.email,
        name: tourist.name,
        subject: "KAVACH safety check: please confirm you are safe",
        context: { kind: "SOLO_SIGNAL_LOSS", alertId: alert.id, tripId: trip.id, userId: tourist.id },
        textContent:
          `KAVACH has not received a trusted location update from you for at least 10 minutes during your solo trip to ${trip.locationName}.\n` +
          `Please open your current trip and confirm that you are safe by ${deadline}.\n` +
          `If you do not respond, a Disaster Management incident will be opened so an operator can call you. Any fleet dispatch remains a manual Disaster Management decision.\n\n` +
          `Open current trip: ${link}`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0f172a"><h2>KAVACH safety check</h2><p>We have not received a trusted location update from you for at least <strong>10 minutes</strong> during your solo trip to <strong>${escapeHtml(trip.locationName)}</strong>.</p><p>Please open your current trip and confirm that you are safe. If there is no response, KAVACH will create a Disaster Management incident so an operator can contact you by phone. Fleet dispatch remains manual.</p><p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px">Confirm safety</a></p></div>`,
      });
    },

    async signalLossAlert({ recipients, member, trip, signalCase, reminder = false }) {
      const destination = `/tourist/trips/current`;
      const link = loginLink(config, destination, "TOURIST");
      const subject = `${reminder ? "Still offline" : "Signal lost"}: ${member.name || "group member"}`;
      return Promise.all((recipients || []).filter((r) => r?.email).map((recipient) => send({
        to: recipient.email,
        name: recipient.name,
        subject,
        context: { kind: reminder ? "SIGNAL_LOSS_REMINDER" : "SIGNAL_LOSS", signalLossCaseId: signalCase.id },
        textContent: `${member.name || "A group member"} has not sent a trusted location update for at least 5 minutes on ${trip.locationName}.\nLeader response is required within 5 minutes: false alarm or confirmed danger.\n\nOpen KAVACH: ${link}`,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#0f172a"><h2>${reminder ? "Group member is still offline" : "Group member signal lost"}</h2><p><strong>${escapeHtml(member.name || "A group member")}</strong> has not sent a trusted location update for at least 5 minutes during <strong>${escapeHtml(trip.locationName)}</strong>.</p><p>The group leader has a 5-minute window to mark this as a false alarm or confirm danger. If there is no response, the case is escalated to Disaster Management.</p><p style="margin:24px 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px">Open signal-loss case</a></p></div>`,
      })));
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
