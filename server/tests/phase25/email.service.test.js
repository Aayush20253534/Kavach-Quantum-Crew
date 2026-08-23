import { jest } from "@jest/globals";

import { createEmailService } from "../../src/modules/auth/email.service.js";

describe("Brevo verification email service", () => {
  test("sends the six digit code through the Brevo HTTP API", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({
        messageId: "brevo-message-1",
      }),
    });

    const service = createEmailService({
      fetchImpl,
      config: {
        BREVO_API_KEY: "test-brevo-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "QuantumCrew",
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
      messageId: "brevo-message-1",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.brevo.com/v3/smtp/email",
      expect.objectContaining({
        method: "POST",
      }),
    );

    const request = fetchImpl.mock.calls[0][1];
    const body = JSON.parse(request.body);

    expect(request.headers["api-key"]).toBe("test-brevo-key");
    expect(body.sender).toEqual({
      name: "QuantumCrew",
      email: "sender@example.com",
    });
    expect(body.to).toEqual([
      {
        email: "tourist@example.com",
        name: "Tourist",
      },
    ]);
    expect(body.subject).toBe(
      "Verify your Smart Tourist Safety account",
    );
    expect(body.textContent).toContain("654321");
    expect(body.htmlContent).toContain("654321");
  });

  test("fails safely when Brevo is not configured", async () => {
    const service = createEmailService({
      fetchImpl: jest.fn(),
      config: {
        BREVO_API_KEY: undefined,
        BREVO_SENDER_EMAIL: undefined,
        BREVO_SENDER_NAME: "QuantumCrew",
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

  test("converts a Brevo provider failure into a safe API error", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({
        message: "Key not found",
      }),
    });

    const service = createEmailService({
      fetchImpl,
      config: {
        BREVO_API_KEY: "invalid-key",
        BREVO_SENDER_EMAIL: "sender@example.com",
        BREVO_SENDER_NAME: "QuantumCrew",
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
