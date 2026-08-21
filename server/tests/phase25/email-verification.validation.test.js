import {
  resendEmailVerificationBodySchema,
  verifyEmailBodySchema,
} from "../../src/modules/auth/auth.validation.js";

describe("Email verification validation", () => {
  test("accepts a normalized email and six digit OTP", () => {
    expect(
      verifyEmailBodySchema.parse({
        email: "TOURIST@example.com",
        otp: "123456",
      }),
    ).toEqual({ email: "tourist@example.com", otp: "123456" });
  });

  test("rejects non six-digit OTP values", () => {
    expect(
      verifyEmailBodySchema.safeParse({
        email: "tourist@example.com",
        otp: "12345",
      }).success,
    ).toBe(false);
    expect(
      verifyEmailBodySchema.safeParse({
        email: "tourist@example.com",
        otp: "12345a",
      }).success,
    ).toBe(false);
  });

  test("accepts resend request by email", () => {
    expect(
      resendEmailVerificationBodySchema.parse({ email: "TOURIST@example.com" }),
    ).toEqual({ email: "tourist@example.com" });
  });
});
