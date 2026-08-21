import nodemailer from "nodemailer";

import { ApiError } from "../../common/errors/ApiError.js";
import { environment } from "../../config/environment.js";

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const createGmailTransporter = (config) => {
  if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.GMAIL_USER,
      pass: config.GMAIL_APP_PASSWORD,
    },
  });
};

export const createEmailService = ({
  config = environment,
  transporter = createGmailTransporter(config),
} = {}) => ({
  async sendVerificationOtp({ to, name, otp, expiresInMinutes }) {
    if (!transporter) {
      throw ApiError.serviceUnavailable("Email delivery is not configured", {
        code: "EMAIL_PROVIDER_NOT_CONFIGURED",
      });
    }

    const from = config.EMAIL_FROM || config.GMAIL_USER;

    try {
      const result = await transporter.sendMail({
        from: `Smart Tourist Safety <${from}>`,
        to,
        subject: "Verify your Smart Tourist Safety account",
        text: `Hello ${name}, your verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
            <h2>Verify your email</h2>
            <p>Hello ${escapeHtml(name)},</p>
            <p>Use this 6-digit code to verify your Smart Tourist Safety account:</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${otp}</p>
            <p>This code expires in ${expiresInMinutes} minutes.</p>
            <p>If you did not create this account, you can ignore this email.</p>
          </div>
        `,
      });

      return { messageId: result.messageId ?? null };
    } catch (cause) {
      throw ApiError.serviceUnavailable("Verification email could not be sent", {
        code: "EMAIL_DELIVERY_FAILED",
        cause,
      });
    }
  },
});

export const emailService = createEmailService();
export default emailService;
