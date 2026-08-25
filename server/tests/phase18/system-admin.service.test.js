import { jest } from "@jest/globals";
import { createSystemAdminService } from "../../src/modules/system-admin/system-admin.service.js";

const admin = { id: "11111111-1111-4111-8111-111111111111", role: "SYSTEM_ADMIN" };
const tourist = { id: "22222222-2222-4222-8222-222222222222", role: "TOURIST" };
const account = { id: tourist.id, name: "Tourist", status: "ACTIVE", role: "TOURIST" };

const setup = (overrides = {}) => {
  const repository = {
    dashboard: jest.fn().mockResolvedValue({ tourists: 1, openIncidents: 2 }),
    listAccounts: jest.fn().mockResolvedValue([account]),
    findAccount: jest.fn().mockResolvedValue(account),
    updateAccountStatus: jest.fn().mockImplementation(async (role, id, status) => ({ ...account, id, role, status })),
    listResource: jest.fn().mockResolvedValue([]),
    createAudit: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  return { repository, service: createSystemAdminService({ repository }) };
};

describe("Phase 18 system admin service", () => {
  test("returns platform dashboard for system admin", async () => {
    const { service } = setup();
    await expect(service.dashboard(admin)).resolves.toMatchObject({ tourists: 1, openIncidents: 2 });
  });

 test("rejects non admin access", () => {
  const repository = {
    dashboard: jest.fn(),
  };

  const service = createSystemAdminService({ repository });

  expect(() =>
    service.dashboard({
      id: "tourist-1",
      role: "TOURIST",
    }),
  ).toThrow(
    expect.objectContaining({
      statusCode: 403,
      code: "SYSTEM_ADMIN_REQUIRED",
    }),
  );

  expect(repository.dashboard).not.toHaveBeenCalled();
});

  test("changes account status and audits the action", async () => {
    const { service, repository } = setup();
    const result = await service.setAccountStatus(admin, "TOURIST", tourist.id, "SUSPENDED", "Manual review");
    expect(result.status).toBe("SUSPENDED");
    expect(repository.createAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "ADMIN_ACCOUNT_STATUS_CHANGED" }));
  });

  test("prevents an admin from disabling itself", async () => {
    const self = { ...account, id: admin.id, role: "SYSTEM_ADMIN" };
    const { service } = setup({ findAccount: jest.fn().mockResolvedValue(self) });
    await expect(service.setAccountStatus(admin, "SYSTEM_ADMIN", admin.id, "DISABLED")).rejects.toMatchObject({ code: "ADMIN_SELF_DEACTIVATION_FORBIDDEN" });
  });

  test("lists operational resources", async () => {
    const { service, repository } = setup();
    await service.listResource(admin, "incidents", { limit: 10 });
    expect(repository.listResource).toHaveBeenCalledWith("incidents", { limit: 10 });
  });
});
