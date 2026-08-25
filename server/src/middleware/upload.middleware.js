import multer from "multer";

import { environment } from "../config/environment.js";

export const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: environment.PROFILE_IMAGE_MAX_FILE_BYTES,
  },
}).single("image");

export default profileImageUpload;


export const medicalDocumentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: environment.MEDICAL_DOCUMENT_MAX_FILE_BYTES,
  },
}).single("document");
