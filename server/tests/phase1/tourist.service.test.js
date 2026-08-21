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

describe("Phase 3 tourist profile service", () => {
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

  test("does not allow onboarding to be completed twice", async () => {
    const repository = {
      findByUserId: jest.fn().mockResolvedValue({ ...baseUser, onboardingCompleted: true }),
    };
    const service = createTouristService({ repository });

    await expect(
      service.completeOnboarding(baseUser.id, {
        gender: "MALE",
        age: 21,
        emergencyPhone: "+919876543211",
        nationality: "Indian",
      }),
    ).rejects.toMatchObject({ code: "ONBOARDING_ALREADY_COMPLETED" });
  });

  test("updates all editable profile identity and emergency fields", async () => {
    const existing = { ...baseUser, onboardingCompleted: true };
    const updated = {
      ...existing,
      name: "Tourist Updated",
      username: "tourist.updated",
      email: "updated@example.com",
      phone: "+919876543212",
      emergencyPhone: "+919876543213",
      profilePicUrl: "https://cdn.example.com/profile.jpg",
      nationality: "Indian",
    };
    const repository = {
      findByUserId: jest.fn().mockResolvedValue(existing),
      findUsernameConflict: jest.fn().mockResolvedValue(null),
      findEmailConflict: jest.fn().mockResolvedValue(null),
      findPhoneConflict: jest.fn().mockResolvedValue(null),
      updateProfile: jest.fn().mockResolvedValue(updated),
    };
    const service = createTouristService({ repository });

    const result = await service.updateProfile(baseUser.id, {
      name: "Tourist Updated",
      username: "tourist.updated",
      email: "updated@example.com",
      phone: "+919876543212",
      emergencyPhone: "+919876543213",
      profilePicUrl: "https://cdn.example.com/profile.jpg",
      nationality: "Indian",
    });

    expect(repository.updateProfile).toHaveBeenCalledWith(baseUser.id, expect.objectContaining({
      username: "tourist.updated",
      email: "updated@example.com",
      phone: "+919876543212",
    }));
    expect(result).toMatchObject({
      username: "tourist.updated",
      email: "updated@example.com",
      emergencyContact: "+919876543213",
      profilePic: "https://cdn.example.com/profile.jpg",
    });
  });

  test.each([
    ["username", "findUsernameConflict", "USERNAME_ALREADY_EXISTS"],
    ["email", "findEmailConflict", "EMAIL_ALREADY_EXISTS"],
    ["phone", "findPhoneConflict", "PHONE_ALREADY_EXISTS"],
  ])("rejects duplicate %s during profile update", async (field, method, code) => {
    const existing = { ...baseUser, onboardingCompleted: true };
    const values = {
      username: "another.user",
      email: "another@example.com",
      phone: "+919876543299",
    };
    const repository = {
      findByUserId: jest.fn().mockResolvedValue(existing),
      [method]: jest.fn().mockResolvedValue({ id: "other-user" }),
    };
    const service = createTouristService({ repository });

    await expect(service.updateProfile(baseUser.id, { [field]: values[field] }))
      .rejects.toMatchObject({ code });
  });
});
