import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createObjectStorageAdapter } from "../../src/integrations/storage/objectStorage.adapter.js";

describe("Phase 17 object storage adapter", () => {
  test("writes, reads, and deletes evidence bytes", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "sts-evidence-"));
    try {
      const storage = createObjectStorageAdapter({ directory });
      const stored = await storage.put({ buffer: Buffer.from("abc") });
      await expect(storage.get(stored.storageKey)).resolves.toEqual(Buffer.from("abc"));
      await storage.delete(stored.storageKey);
      await expect(storage.get(stored.storageKey)).rejects.toBeTruthy();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
