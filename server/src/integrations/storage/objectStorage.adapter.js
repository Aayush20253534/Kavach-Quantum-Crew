import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { environment } from "../../config/environment.js";

const resolveStoragePath = (directory, storageKey) => {
  const safeKey = path.basename(storageKey);
  if (safeKey !== storageKey) throw new Error("Invalid storage key");
  return path.resolve(directory, safeKey);
};

export const createObjectStorageAdapter = ({
  directory = environment.EVIDENCE_STORAGE_DIR,
} = {}) => ({
  async put({ buffer }) {
    await mkdir(directory, { recursive: true });
    const storageKey = randomUUID();
    await writeFile(resolveStoragePath(directory, storageKey), buffer);
    return { storageKey };
  },

  async get(storageKey) {
    return readFile(resolveStoragePath(directory, storageKey));
  },

  async delete(storageKey) {
    await rm(resolveStoragePath(directory, storageKey), { force: true });
  },
});

export const objectStorageAdapter = createObjectStorageAdapter();
export default objectStorageAdapter;
