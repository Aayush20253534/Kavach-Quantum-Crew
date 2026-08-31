import { jest } from "@jest/globals";

import { createEmailService } from "../../src/modules/auth/email.service.js";

describe("Mailjet verification email service", () => {
  test("sends the six digit code through the Mailjet Send API", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        Messages: [
          {
            Status: "success",
            To: [
              {
                Email: "tourist@example.com",
                MessageUUID: "mailjet-message-1",
                MessageID: 123,
              },
            ],
          },
        ],
      }),
    });

    const service = createEmailService({
      fetchImpl,
      config: {
        MAILJET_API_KEY: "test-mailjet-key",
        MAILJET_SECRET_KEY: "test-mailjet-secret",
        MAILJET_SENDER_EMAIL: "sender@example.com",
        MAILJET_SENDER_NAME: "QuantumCrew",
      },
    });

    await expect(
      service.sendVerificationOtp({
        to: "tourist@example.com",
        name: "Tourist",
        otp: "654321",
        expiresInMinutes: 10,
      }),
    ).resolves.toEqual({
      messageId: "mailjet-message-1",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.mailjet.com/v3.1/send",
      expect.objectContaining({ method: "POST" }),
    );

    const request = fetchImpl.mock.calls[0][1];
    const body = JSON.parse(request.body);

    expect(request.headers.authorization).toBe(
      `Basic ${Buffer.from("test-mailjet-key:test-mailjet-secret").toString("base64")}`,
    );
    expect(body.Messages[0].From).toEqual({
      Name: "QuantumCrew",
      Email: "sender@example.com",
    });
    expect(body.Messages[0].To).toEqual([
      {
        Email: "tourist@example.com",
        Name: "Tourist",
      },
    ]);
    expect(body.Messages[0].Subject).toBe(
      "Verify your Smart Tourist Safety account",
    );
    expect(body.Messages[0].TextPart).toContain("654321");
    expect(body.Messages[0].HTMLPart).toContain("654321");
  });

  test("fails safely when Mailjet is not configured", async () => {
    const service = createEmailService({
      fetchImpl: jest.fn(),
      config: {
        MAILJET_API_KEY: undefined,
        MAILJET_SECRET_KEY: undefined,
        MAILJET_SENDER_EMAIL: undefined,
        MAILJET_SENDER_NAME: "QuantumCrew",
      },
    });

    await expect(
      service.sendVerificationOtp({
        to: "tourist@example.com",
        name: "Tourist",
        otp: "123456",
        expiresInMinutes: 10,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "EMAIL_PROVIDER_NOT_CONFIGURED",
    });
  });

  test("converts a Mailjet provider failure into a safe API error", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({
        ErrorMessage: "Invalid API credentials",
      }),
    });

    const service = createEmailService({
      fetchImpl,
      config: {
        MAILJET_API_KEY: "invalid-key",
        MAILJET_SECRET_KEY: "invalid-secret",
        MAILJET_SENDER_EMAIL: "sender@example.com",
        MAILJET_SENDER_NAME: "QuantumCrew",
      },
    });

    await expect(
      service.sendVerificationOtp({
        to: "tourist@example.com",
        name: "Tourist",
        otp: "123456",
        expiresInMinutes: 10,
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "EMAIL_DELIVERY_FAILED",
    });
  });
});
