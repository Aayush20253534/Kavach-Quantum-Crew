import { ApiError } from "../../common/errors/ApiError.js";
import { environment } from "../../config/environment.js";
import { sendMailjetEmail } from "../../integrations/notifications/mailjet.client.js";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const createEmailService = ({
  config = environment,
  fetchImpl = globalThis.fetch,
} = {}) => ({
  async sendTripEndingReminder({
    to,
    name,
    locationName,
    plannedEndAt,
  }) {
    if (
      !config.MAILJET_API_KEY ||
      !config.MAILJET_SECRET_KEY ||
      !config.MAILJET_SENDER_EMAIL ||
      typeof fetchImpl !== "function"
    ) {
      throw ApiError.serviceUnavailable("Email delivery is not configured", {
        code: "EMAIL_PROVIDER_NOT_CONFIGURED",
      });
    }

    const safeName = typeof name === "string" && name.trim() ? name.trim() : "Tourist";
    const safeLocation = locationName || "your current trip";
    const endText = new Date(plannedEndAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });

    const subject = `Your KAVACH trip ends in about 30 minutes`;
    const textContent =
      `Hello ${safeName}, your trip to ${safeLocation} is scheduled to end at ${endText}. ` +
      `Open KAVACH before the end time if you need to extend the trip.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Your trip is ending soon</h2>
        <p>Hello ${escapeHtml(safeName)},</p>
        <p>
          Your KAVACH trip to <strong>${escapeHtml(safeLocation)}</strong>
          is scheduled to end at <strong>${escapeHtml(endText)}</strong>.
        </p>
        <p>
          Routine live tracking and trip safety sharing will stop when the trip ends.
          If you are still travelling, open KAVACH and use <strong>Extend Trip</strong>
          before the scheduled end time.
        </p>
        <p style="color: #64748b; font-size: 13px;">
          This reminder is sent roughly 30 minutes before the planned trip end.
        </p>
      </div>
    `;

    try {
      const result = await sendMailjetEmail({
        to,
        name: safeName,
        subject,
        textContent,
        htmlContent,
        config,
        fetchImpl,
      });
      return { messageId: result.messageId };
    } catch (cause) {
      throw ApiError.serviceUnavailable("Trip reminder email could not be sent", {
        code: "TRIP_REMINDER_EMAIL_FAILED",
        cause,
      });
    }
  },

  async sendPasswordResetOtp({
    to,
    name,
    otp,
    expiresInMinutes,
  }) {
    if (
      !config.MAILJET_API_KEY ||
      !config.MAILJET_SECRET_KEY ||
      !config.MAILJET_SENDER_EMAIL ||
      typeof fetchImpl !== "function"
    ) {
      throw ApiError.serviceUnavailable("Email delivery is not configured", {
        code: "EMAIL_PROVIDER_NOT_CONFIGURED",
      });
    }

    const safeName =
      typeof name === "string" && name.trim() ? name.trim() : "KAVACH user";

    const subject = "Reset your KAVACH password";
    const textContent =
      `Hello ${safeName}, your password reset code is ${otp}. ` +
      `It expires in ${expiresInMinutes} minutes. If you did not request this, ignore this email.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Reset your password</h2>
        <p>Hello ${escapeHtml(safeName)},</p>
        <p>Use this 6-digit code to confirm your KAVACH password reset:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">
          ${escapeHtml(otp)}
        </p>
        <p>This code expires in ${expiresInMinutes} minutes.</p>
        <p style="color: #64748b; font-size: 13px;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      const result = await sendMailjetEmail({
        to,
        name: safeName,
        subject,
        textContent,
        htmlContent,
        config,
        fetchImpl,
      });
      return { messageId: result.messageId };
    } catch (cause) {
      throw ApiError.serviceUnavailable("Password reset email could not be sent", {
        code: "PASSWORD_RESET_EMAIL_FAILED",
        cause,
      });
    }
  },

  async sendVerificationOtp({
    to,
    name,
    otp,
    expiresInMinutes,
  }) {
    if (
      !config.MAILJET_API_KEY ||
      !config.MAILJET_SECRET_KEY ||
      !config.MAILJET_SENDER_EMAIL ||
      typeof fetchImpl !== "function"
    ) {
      throw ApiError.serviceUnavailable(
        "Email delivery is not configured",
        {
          code:
            "EMAIL_PROVIDER_NOT_CONFIGURED",
        },
      );
    }

    const safeName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : "Tourist";

    const textContent =
      `Hello ${safeName}, your verification code is ${otp}. ` +
      `It expires in ${expiresInMinutes} minutes.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px;">
        <h2>Verify your email</h2>

        <p>Hello ${escapeHtml(safeName)},</p>

        <p>
          Use this 6-digit code to verify your
          Smart Tourist Safety account:
        </p>

        <p
          style="
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
            margin: 24px 0;
          "
        >
          ${escapeHtml(otp)}
        </p>

        <p>
          This code expires in
          ${expiresInMinutes} minutes.
        </p>

        <p>
          If you did not create this account,
          you can ignore this email.
        </p>
      </div>
    `;

    try {
      const result = await sendMailjetEmail({
        to,
        name: safeName,
        subject: "Verify your Smart Tourist Safety account",
        textContent,
        htmlContent,
        config,
        fetchImpl,
      });

      return { messageId: result.messageId };
    } catch (cause) {
      throw ApiError.serviceUnavailable(
        "Verification email could not be sent",
        {
          code: "EMAIL_DELIVERY_FAILED",
          cause,
        },
      );
    }
  },
});

export const emailService =
  createEmailService();

export default emailService;