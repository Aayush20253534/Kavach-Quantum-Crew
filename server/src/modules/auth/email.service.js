import { ApiError } from "../../common/errors/ApiError.js";
import { environment } from "../../config/environment.js";

const BREVO_EMAIL_ENDPOINT =
  "https://api.brevo.com/v3/smtp/email";

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
  async sendVerificationOtp({
    to,
    name,
    otp,
    expiresInMinutes,
  }) {
    if (
      !config.BREVO_API_KEY ||
      !config.BREVO_SENDER_EMAIL ||
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
      const response = await fetchImpl(
        BREVO_EMAIL_ENDPOINT,
        {
          method: "POST",

          headers: {
            accept: "application/json",
            "api-key": config.BREVO_API_KEY,
            "content-type":
              "application/json",
          },

          body: JSON.stringify({
            sender: {
              name:
                config.BREVO_SENDER_NAME ||
                "QuantumCrew",

              email:
                config.BREVO_SENDER_EMAIL,
            },

            to: [
              {
                email: to,
                name: safeName,
              },
            ],

            subject:
              "Verify your Smart Tourist Safety account",

            textContent,
            htmlContent,
          }),
        },
      );

      const payload = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const providerError = new Error(
          payload?.message ||
            `Brevo returned HTTP ${response.status}`,
        );

        providerError.status =
          response.status;

        providerError.response =
          payload;

        throw providerError;
      }

      return {
        messageId:
          payload?.messageId ?? null,
      };
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