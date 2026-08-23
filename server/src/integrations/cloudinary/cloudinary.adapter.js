import { createHash } from "node:crypto";

import { ApiError } from "../../common/errors/ApiError.js";
import { environment } from "../../config/environment.js";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const signatureFor = (params, secret) => {
  const payload = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${payload}${secret}`)
    .digest("hex");
};

export const createCloudinaryAdapter = ({
  config = environment,
  fetchImpl = globalThis.fetch,
  clock = () => Date.now(),
} = {}) => ({
  async uploadTouristProfileImage({ userId, file }) {
    if (
      !config.CLOUDINARY_CLOUD_NAME ||
      !config.CLOUDINARY_API_KEY ||
      !config.CLOUDINARY_API_SECRET ||
      typeof fetchImpl !== "function"
    ) {
      throw ApiError.serviceUnavailable("Profile image storage is not configured", {
        code: "CLOUDINARY_NOT_CONFIGURED",
      });
    }

    if (!file?.buffer?.length) {
      throw ApiError.badRequest("A profile image is required", {
        code: "PROFILE_IMAGE_REQUIRED",
      });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw ApiError.badRequest("Profile image must be JPEG, PNG, or WebP", {
        code: "PROFILE_IMAGE_TYPE_INVALID",
      });
    }

    if (file.size > config.PROFILE_IMAGE_MAX_FILE_BYTES) {
      throw ApiError.badRequest("Profile image exceeds the upload limit", {
        code: "PROFILE_IMAGE_TOO_LARGE",
      });
    }

    const timestamp = Math.floor(clock() / 1000);
    const publicId = `quantum-crew/tourist-profiles/${userId}`;
    const signedParams = {
      invalidate: "true",
      overwrite: "true",
      public_id: publicId,
      timestamp,
    };

    const signature = signatureFor(
      signedParams,
      config.CLOUDINARY_API_SECRET,
    );

    const form = new FormData();
    form.append(
      "file",
      new Blob([file.buffer], { type: file.mimetype }),
      file.originalname || "profile-image",
    );
    form.append("api_key", config.CLOUDINARY_API_KEY);
    form.append("timestamp", String(timestamp));
    form.append("public_id", publicId);
    form.append("overwrite", "true");
    form.append("invalidate", "true");
    form.append("signature", signature);

    try {
      const response = await fetchImpl(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(
          config.CLOUDINARY_CLOUD_NAME,
        )}/image/upload`,
        {
          method: "POST",
          body: form,
        },
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.secure_url) {
        const cause = new Error(
          payload?.error?.message ||
            `Cloudinary returned HTTP ${response.status}`,
        );
        cause.status = response.status;
        throw cause;
      }

      return {
        url: payload.secure_url,
        publicId: payload.public_id ?? publicId,
        width: payload.width ?? null,
        height: payload.height ?? null,
        format: payload.format ?? null,
      };
    } catch (cause) {
      if (cause instanceof ApiError) throw cause;

      throw ApiError.serviceUnavailable("Profile image could not be uploaded", {
        code: "PROFILE_IMAGE_UPLOAD_FAILED",
        cause,
      });
    }
  },
});

export const cloudinaryAdapter = createCloudinaryAdapter();
export default cloudinaryAdapter;
