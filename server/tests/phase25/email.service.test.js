import { jest } from "@jest/globals";

import { createEmailService } from "../../src/modules/auth/email.service.js";

describe("Gmail verification email service", () => {
  test("sends the six digit code through the configured transporter", async () => {
    const transporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: "gmail-message-1" }),
    };
    const service = createEmailService({
      transporter,
      config: {
        GMAIL_USER: "sender@gmail.com",
        EMAIL_FROM: "sender@gmail.com",
      },
    });

    await expect(
      service.sendVerificationOtp({
        to: "tourist@example.com",
        name: "Tourist",
        otp: "654321",
        expiresInMinutes: 10,
      }),
    ).resolves.toEqual({ messageId: "gmail-message-1" });

    expect(transporter.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "tourist@example.com",
        subject: "Verify your Smart Tourist Safety account",
        text: expect.stringContaining("654321"),
      }),
    );
  });

  test("fails safely when Gmail is not configured", async () => {
    const service = createEmailService({
      transporter: null,
      config: { GMAIL_USER: undefined, EMAIL_FROM: undefined },
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
});
