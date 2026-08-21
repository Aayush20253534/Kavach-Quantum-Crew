import { jest } from "@jest/globals";

import { createTouristService } from "../../src/modules/tourist/tourist.service.js";

const baseUser = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Tourist One",
  username: "tourist.one",
  email: "tourist@example.com",
  phone: "+919876543210",
  onboardingCompleted: false,
  profilePicUrl: null,
  gender: null,
  age: null,
  medicalHistory: null,
  emergencyPhone: null,
  nationality: null,
};

describe("Phase 1 tourist profile service", () => {
  test("returns an incomplete profile before onboarding", async () => {
    const repository = { findByUserId: jest.fn().mockResolvedValue(baseUser) };
    const service = createTouristService({ repository });

    await expect(service.getProfile(baseUser.id)).resolves.toMatchObject({
      username: "tourist.one",
      emergencyContact: null,
      onboardingCompleted: false,
    });
  });

  test("completes tourist onboarding directly on the user record", async () => {
    const completed = {
      ...baseUser,
      onboardingCompleted: true,
      gender: "MALE",
      age: 21,
      emergencyPhone: "+919876543211",
      nationality: "Indian",
    };
    const repository = {
      findByUserId: jest.fn().mockResolvedValue(baseUser),
      completeOnboarding: jest.fn().mockResolvedValue(completed),
    };
    const service = createTouristService({ repository });

    await expect(
      service.completeOnboarding(baseUser.id, {
        gender: "MALE",
        age: 21,
        emergencyPhone: "+919876543211",
        nationality: "Indian",
      }),
    ).resolves.toMatchObject({
      gender: "MALE",
      emergencyContact: "+919876543211",
      onboardingCompleted: true,
    });
  });
});
