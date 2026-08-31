import { environment } from "../../config/environment.js";

export const MAILJET_SEND_ENDPOINT = "https://api.mailjet.com/v3.1/send";

const mailjetAuthHeader = (apiKey, secretKey) =>
  `Basic ${Buffer.from(`${apiKey}:${secretKey}`, "utf8").toString("base64")}`;

export const isMailjetConfigured = (config = environment) =>
  Boolean(
    config.MAILJET_API_KEY &&
      config.MAILJET_SECRET_KEY &&
      config.MAILJET_SENDER_EMAIL,
  );

export const sendMailjetEmail = async ({
  to,
  name,
  subject,
  textContent,
  htmlContent,
  config = environment,
  fetchImpl = globalThis.fetch,
}) => {
  if (!isMailjetConfigured(config) || typeof fetchImpl !== "function") {
    const error = new Error("Mailjet email delivery is not configured");
    error.code = "EMAIL_PROVIDER_NOT_CONFIGURED";
    throw error;
  }

  const response = await fetchImpl(MAILJET_SEND_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: mailjetAuthHeader(
        config.MAILJET_API_KEY,
        config.MAILJET_SECRET_KEY,
      ),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email: config.MAILJET_SENDER_EMAIL,
            Name: config.MAILJET_SENDER_NAME || "QuantumCrew",
          },
          To: [
            {
              Email: to,
              Name: name || to,
            },
          ],
          Subject: subject,
          TextPart: textContent,
          HTMLPart: htmlContent,
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  const message = payload?.Messages?.[0];

  if (!response.ok || message?.Status === "error") {
    const providerMessage =
      message?.Errors?.[0]?.ErrorMessage ||
      message?.Errors?.[0]?.ErrorRelatedTo?.join(", ") ||
      payload?.ErrorMessage ||
      payload?.message ||
      `Mailjet returned HTTP ${response.status}`;

    const error = new Error(providerMessage);
    error.status = response.status;
    error.response = payload;
    throw error;
  }

  const recipient = message?.To?.[0];
  return {
    messageId:
      recipient?.MessageUUID ??
      recipient?.MessageID ??
      message?.MessageUUID ??
      message?.MessageID ??
      null,
    payload,
  };
};
