import { jest } from "@jest/globals";

import { createSystemAdminService } from "../../src/modules/system-admin/system-admin.service.js";

const actor = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "SYSTEM_ADMIN",
};

const destination = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "varanasi",
  name: "Varanasi",
  state: "Uttar Pradesh",
  country: "India",
  latitude: 25.3176,
  longitude: 82.9739,
  description: "Historic city",
  imageUrl: null,
  featured: true,
  active: true,
  sortOrder: 5,
};

const repository = () => ({
  dashboard: jest.fn(),
  listAccounts: jest.fn(),
  findAccount: jest.fn(),
  updateAccountStatus: jest.fn(),
  listResource: jest.fn(),
  listDestinations: jest.fn(),
  findDestination: jest.fn(),
  findDestinationConflict: jest.fn(),
  createDestination: jest.fn(),
  updateDestination: jest.fn(),
  deleteDestination: jest.fn(),
  createAudit: jest.fn().mockResolvedValue({}),
});

describe("system admin destination management", () => {
  test("creates a destination and invalidates destination cache", async () => {
    const repo = repository();
    repo.findDestinationConflict.mockResolvedValue(null);
    repo.createDestination.mockResolvedValue(destination);
    const invalidateDestinationCache = jest.fn();

    const service = createSystemAdminService({
      repository: repo,
      invalidateDestinationCache,
    });

    await expect(
      service.createDestination(actor, {
        name: "Varanasi",
        state: "Uttar Pradesh",
        country: "India",
        latitude: 25.3176,
        longitude: 82.9739,
        description: "Historic city",
        featured: true,
        active: true,
        sortOrder: 5,
      }),
    ).resolves.toEqual(destination);

    expect(repo.createDestination).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "varanasi" }),
    );
    expect(invalidateDestinationCache).toHaveBeenCalled();
  });

  test("uploads an image and stores its Cloudinary URL", async () => {
    const repo = repository();
    repo.findDestination.mockResolvedValue(destination);
    repo.updateDestination.mockResolvedValue({
      ...destination,
      imageUrl: "https://res.cloudinary.com/demo/varanasi.jpg",
    });

    const imageStorage = {
      uploadDestinationImage: jest.fn().mockResolvedValue({
        url: "https://res.cloudinary.com/demo/varanasi.jpg",
        publicId: "quantum-crew/destinations/test",
      }),
    };

    const service = createSystemAdminService({
      repository: repo,
      imageStorage,
      invalidateDestinationCache: jest.fn(),
    });

    await service.uploadDestinationImage(actor, destination.id, {
      buffer: Buffer.from("image"),
    });

    expect(repo.updateDestination).toHaveBeenCalledWith(destination.id, {
      imageUrl: "https://res.cloudinary.com/demo/varanasi.jpg",
    });
  });

  test("rejects destination management for non-admin actors", async () => {
    const service = createSystemAdminService({
      repository: repository(),
    });

    await expect(
      service.createDestination(
        { id: "u1", role: "TOURIST" },
        destination,
      ),
    ).rejects.toMatchObject({
      code: "SYSTEM_ADMIN_REQUIRED",
      statusCode: 403,
    });
  });
});
