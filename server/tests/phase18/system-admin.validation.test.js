import { adminAccountListQuerySchema, adminAccountStatusBodySchema, adminResourceParamsSchema } from "../../src/modules/system-admin/system-admin.validation.js";

describe("Phase 18 system admin validation", () => {
  test("accepts account filters", () => {
    expect(adminAccountListQuerySchema.parse({ role: "TOURIST", status: "ACTIVE", limit: "20" })).toMatchObject({ role: "TOURIST", status: "ACTIVE", limit: 20 });
  });

  test("accepts supported account status changes", () => {
    expect(adminAccountStatusBodySchema.parse({ status: "SUSPENDED", reason: "Review" }).status).toBe("SUSPENDED");
  });

  test("rejects unknown administrative resource", () => {
    expect(() => adminResourceParamsSchema.parse({ resource: "passwords" })).toThrow();
  });
});
