import { jest } from "@jest/globals";

import { sha256 } from "../../src/common/utils/hash.js";
import { hashPassword } from "../../src/common/utils/password.js";
import { createAuthService } from "../../src/modules/auth/auth.service.js";

const config = {
  ACCESS_TOKEN_SECRET: "test-access-secret-with-more-than-32-characters",
  REFRESH_TOKEN_SECRET: "test-refresh-secret-with-more-than-32-characters",
  ACCESS_TOKEN_TTL: "15m",
  REFRESH_TOKEN_TTL_DAYS: 15,
  JWT_ISSUER: "smart-tourist-safety-test",
  JWT_AUDIENCE: "smart-tourist-safety-client-test",
  EMAIL_OTP_SECRET: "test-email-otp-secret-with-more-than-32-characters",
  EMAIL_OTP_TTL_MINUTES: 10,
  EMAIL_OTP_RESEND_COOLDOWN_SECONDS: 60,
  EMAIL_OTP_MAX_ATTEMPTS: 5,
};

const user = {
  id: "11111111-1111-1111-1111-111111111111",
  role: "TOURIST",
  name: "Tourist One",
  username: "tourist.one",
  email: "tourist@example.com",
  phone: "+919876543210",
  status: "ACTIVE",
  emailVerifiedAt: null,
};

const otpHash = (otp) =>
  sha256(`${user.id}:${otp}:${config.EMAIL_OTP_SECRET}`);

describe("Tourist email OTP verification", () => {
  test("registration sends an OTP and does not create an authenticated session", async () => {
    const repository = {
      findRegistrationConflict: jest.fn().mockResolvedValue(null),
      createTourist: jest.fn().mockResolvedValue(user),
      findEmailVerificationOtp: jest.fn().mockResolvedValue(null),
      upsertEmailVerificationOtp: jest.fn().mockResolvedValue({}),
      deleteEmailVerificationOtp: jest.fn(),
      createSession: jest.fn(),
    };
    const mailer = { sendVerificationOtp: jest.fn().mockResolvedValue({}) };
    const service = createAuthService({ repository, mailer, config });

    const result = await service.register({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      password: "Tourist123",
    });

    expect(result.verificationRequired).toBe(true);
    expect(result).not.toHaveProperty("accessToken");
    expect(repository.createSession).not.toHaveBeenCalled();
    expect(mailer.sendVerificationOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        otp: expect.stringMatching(/^\d{6}$/),
      }),
    );
  });

  test("verifies a valid OTP, marks email verified and issues a session", async () => {
    const now = new Date("2026-08-22T00:00:00.000Z");
    const verified = { ...user, emailVerifiedAt: now };
    const repository = {
      findTouristByEmail: jest.fn().mockResolvedValue(user),
      findEmailVerificationOtp: jest.fn().mockResolvedValue({
        userId: user.id,
        codeHash: otpHash("123456"),
        expiresAt: new Date("2026-08-22T00:10:00.000Z"),
        attempts: 0,
      }),
      markTouristEmailVerified: jest.fn().mockResolvedValue(verified),
      deleteEmailVerificationOtp: jest.fn().mockResolvedValue({ count: 1 }),
      createSession: jest.fn().mockResolvedValue({}),
    };
    const service = createAuthService({
      repository,
      mailer: {},
      config,
      clock: () => now,
    });

    const result = await service.verifyEmail({
      email: user.email,
      otp: "123456",
    });

    expect(repository.markTouristEmailVerified).toHaveBeenCalledWith(user.id, now);
    expect(repository.deleteEmailVerificationOtp).toHaveBeenCalledWith(user.id);
    expect(repository.createSession).toHaveBeenCalled();
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  test("rejects a wrong OTP and increments attempts", async () => {
    const repository = {
      findTouristByEmail: jest.fn().mockResolvedValue(user),
      findEmailVerificationOtp: jest.fn().mockResolvedValue({
        userId: user.id,
        codeHash: otpHash("123456"),
        expiresAt: new Date(Date.now() + 60_000),
        attempts: 0,
      }),
      incrementEmailVerificationAttempts: jest.fn().mockResolvedValue({ attempts: 1 }),
      deleteEmailVerificationOtp: jest.fn(),
    };
    const service = createAuthService({ repository, mailer: {}, config });

    await expect(
      service.verifyEmail({ email: user.email, otp: "999999" }),
    ).rejects.toMatchObject({ code: "EMAIL_OTP_INVALID" });
    expect(repository.incrementEmailVerificationAttempts).toHaveBeenCalledWith(user.id);
  });

  test("blocks login until a tourist verifies email", async () => {
    const repository = {
      findByLoginIdentifier: jest.fn().mockResolvedValue({
        ...user,
        passwordHash: await hashPassword("Tourist123"),
      }),
    };
    const service = createAuthService({ repository, mailer: {}, config });

    await expect(
      service.login({ identifier: user.email, password: "Tourist123" }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "EMAIL_VERIFICATION_REQUIRED",
    });
  });});
