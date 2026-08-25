import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createObjectStorageAdapter } from "../../src/integrations/storage/objectStorage.adapter.js";

describe("Phase 23 evidence storage security", () => {
  test("rejects traversal-like storage keys", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "sts-storage-security-"));
    const storage = createObjectStorageAdapter({ directory });

    await expect(storage.get("../secret.txt")).rejects.toThrow("Invalid storage key");
    await expect(storage.delete("nested/secret.txt")).rejects.toThrow("Invalid storage key");

    await rm(directory, { recursive: true, force: true });
  });
});
