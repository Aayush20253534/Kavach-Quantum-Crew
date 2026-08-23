import { jest } from "@jest/globals";

import { createCloudinaryAdapter } from "../../src/integrations/cloudinary/cloudinary.adapter.js";

describe("Cloudinary profile image adapter", () => {
  test("uploads a signed tourist profile image", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        secure_url: "https://res.cloudinary.com/demo/image/upload/profile.jpg",
        public_id: "quantum-crew/tourist-profiles/user-1",
        width: 512,
        height: 512,
        format: "jpg",
      }),
    });

    const adapter = createCloudinaryAdapter({
      fetchImpl,
      clock: () => 1_700_000_000_000,
      config: {
        CLOUDINARY_CLOUD_NAME: "demo",
        CLOUDINARY_API_KEY: "api-key",
        CLOUDINARY_API_SECRET: "api-secret",
        PROFILE_IMAGE_MAX_FILE_BYTES: 5 * 1024 * 1024,
      },
    });

    await expect(
      adapter.uploadTouristProfileImage({
        userId: "user-1",
        file: {
          buffer: Buffer.from("image"),
          mimetype: "image/jpeg",
          originalname: "avatar.jpg",
          size: 5,
        },
      }),
    ).resolves.toMatchObject({
      url: "https://res.cloudinary.com/demo/image/upload/profile.jpg",
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test("rejects unsupported image types before calling Cloudinary", async () => {
    const fetchImpl = jest.fn();

    const adapter = createCloudinaryAdapter({
      fetchImpl,
      config: {
        CLOUDINARY_CLOUD_NAME: "demo",
        CLOUDINARY_API_KEY: "api-key",
        CLOUDINARY_API_SECRET: "api-secret",
        PROFILE_IMAGE_MAX_FILE_BYTES: 5 * 1024 * 1024,
      },
    });

    await expect(
      adapter.uploadTouristProfileImage({
        userId: "user-1",
        file: {
          buffer: Buffer.from("file"),
          mimetype: "application/pdf",
          originalname: "file.pdf",
          size: 4,
        },
      }),
    ).rejects.toMatchObject({
      code: "PROFILE_IMAGE_TYPE_INVALID",
      statusCode: 400,
    });

    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
