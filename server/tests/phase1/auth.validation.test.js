import {
  loginBodySchema,
  registerBodySchema,
} from "../../src/modules/auth/auth.validation.js";
import {
  onboardingBodySchema,
  updateTouristProfileBodySchema,
} from "../../src/modules/tourist/tourist.validation.js";

describe("Phase 1 request validation", () => {
  test("accepts the requested tourist signup fields and normalizes identity", () => {
    const result = registerBodySchema.parse({
      name: "Aayush Kumar",
      username: "Aayush.Dev",
      email: "AAYUSH@example.com",
      phone: "+919876543210",
      password: "Tourist123",
      confirmPassword: "Tourist123",
    });

    expect(result.username).toBe("aayush.dev");
    expect(result.email).toBe("aayush@example.com");
    expect(result).not.toHaveProperty("role");
  });

  test("rejects mismatched signup passwords", () => {
    const result = registerBodySchema.safeParse({
      name: "Tourist One",
      username: "tourist.one",
      email: "tourist@example.com",
      phone: "+919876543210",
      password: "Tourist123",
      confirmPassword: "Different123",
    });

    expect(result.success).toBe(false);
    expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword"))
      .toBe(true);
  });

  test("supports username or email sign-in identifier", () => {
    expect(
      loginBodySchema.parse({ identifier: "tourist.one", password: "x" }),
    ).toEqual({ identifier: "tourist.one", password: "x" });
    expect(
      loginBodySchema.parse({ identifier: "tourist@example.com", password: "x" }),
    ).toEqual({ identifier: "tourist@example.com", password: "x" });
  });

  test("accepts onboarding fields", () => {
    expect(
      onboardingBodySchema.parse({
        gender: "MALE",
        age: 21,
        medicalHistory: "None",
        emergencyPhone: "+919876543211",
        nationality: "Indian",
        preferredLanguage: "English",
        emergencyContactName: "Emergency Contact",
        emergencyContactRelation: "Parent",
        bloodGroup: "O+",
        governmentIdNumber: "TEST-ID-001",
        liveTrackingEnabled: true,
        geoAlertsEnabled: true,
      }),
    ).toMatchObject({
      age: 21,
      nationality: "Indian",
      preferredLanguage: "English",
      bloodGroup: "O+",
      liveTrackingEnabled: true,
      geoAlertsEnabled: true,
    });
  });

  test("requires at least one field for profile update", () => {
    expect(updateTouristProfileBodySchema.safeParse({}).success).toBe(false);
  });
});
