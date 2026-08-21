import multer from "multer";

import { environment } from "../../config/environment.js";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Unsupported evidence file type");
    error.code = "EVIDENCE_FILE_TYPE_UNSUPPORTED";
    callback(error);
    return;
  }

  callback(null, true);
};

const evidenceUpload = multer({
  storage,
  limits: {
    fileSize: environment.EVIDENCE_MAX_FILE_BYTES,
    files: 1,
  },
  fileFilter,
});

export const uploadEvidenceFile = evidenceUpload.single("file");

export { evidenceUpload };

export default evidenceUpload;