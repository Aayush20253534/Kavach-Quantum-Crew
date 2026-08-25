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
      phone: "9876543210",
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
      phone: "9876543210",
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
        emergencyPhone: "9876543211",
        nationality: "Indian",
        preferredLanguage: "English",
        emergencyContactName: "Emergency Contact",
        emergencyContactRelation: "Father",
        bloodGroup: "O+",
        governmentIdType: "PASSPORT",
        governmentIdNumber: "TESTID001",
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

  test("requires usernames to contain at least six characters", () => {
    const base = {
      name: "Tourist One",
      email: "tourist@example.com",
      phone: "9876543210",
      password: "Tourist123",
      confirmPassword: "Tourist123",
    };

    expect(registerBodySchema.safeParse({ ...base, username: "travel" }).success).toBe(true);
    expect(registerBodySchema.safeParse({ ...base, username: "abc12" }).success).toBe(false);
  });

  test("accepts age boundaries and rejects impossible ages", () => {
    const base = {
      gender: "MALE",
      medicalHistory: null,
      emergencyPhone: "9876543211",
      nationality: "India",
      preferredLanguage: "Hindi",
      emergencyContactName: "Emergency Contact",
      emergencyContactRelation: "Father",
      bloodGroup: "AB-",
      governmentIdType: "AADHAAR",
      governmentIdNumber: "123456789012",
      liveTrackingEnabled: true,
      geoAlertsEnabled: true,
    };

    expect(onboardingBodySchema.safeParse({ ...base, age: 0 }).success).toBe(true);
    expect(onboardingBodySchema.safeParse({ ...base, age: 100 }).success).toBe(true);
    expect(onboardingBodySchema.safeParse({ ...base, age: -1 }).success).toBe(false);
    expect(onboardingBodySchema.safeParse({ ...base, age: 101 }).success).toBe(false);
  });

  test("requires exactly ten signup phone digits", () => {
    const base = {
      name: "Tourist One",
      username: "tourist.one",
      email: "tourist@example.com",
      password: "Tourist123",
      confirmPassword: "Tourist123",
    };

    expect(registerBodySchema.safeParse({ ...base, phone: "9876543210" }).success).toBe(true);
    expect(registerBodySchema.safeParse({ ...base, phone: "987654321" }).success).toBe(false);
    expect(registerBodySchema.safeParse({ ...base, phone: "919876543210" }).success).toBe(false);
  });

  test("requires at least one field for profile update", () => {
    expect(updateTouristProfileBodySchema.safeParse({}).success).toBe(false);
  });
});
