import { jest } from "@jest/globals";
import { createEvidenceService } from "../../src/modules/evidence/evidence.service.js";

const tourist = { id: "11111111-1111-4111-8111-111111111111", role: "TOURIST" };
const outsider = { id: "22222222-2222-4222-8222-222222222222", role: "TOURIST" };
const manager = { id: "33333333-3333-4333-8333-333333333333", role: "DISASTER_MANAGER" };
const incident = { id: "44444444-4444-4444-8444-444444444444", tripId: "55555555-5555-4555-8555-555555555555", userId: tourist.id, status: "OPEN" };
const hazard = { id: "66666666-6666-4666-8666-666666666666", reporterId: tourist.id, reporterRole: "TOURIST", status: "PENDING" };
const file = { buffer: Buffer.from("evidence"), mimetype: "image/jpeg", originalname: "proof.jpg", size: 8 };

const setup = (overrides = {}) => {
  const repository = {
    findIncident: jest.fn().mockResolvedValue(incident),
    findTripContext: jest.fn().mockResolvedValue(null),
    findHazard: jest.fn().mockResolvedValue(hazard),
    create: jest.fn().mockImplementation(async (data) => ({ id: "77777777-7777-4777-8777-777777777777", ...data })),
    findById: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({}),
    createAudit: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
  const storage = {
    put: jest.fn().mockResolvedValue({ storageKey: "stored-key" }),
    get: jest.fn().mockResolvedValue(Buffer.from("evidence")),
    delete: jest.fn().mockResolvedValue(),
  };
  const publisher = { publishEvidenceCreated: jest.fn(), publishEvidenceDeleted: jest.fn() };
  return { repository, storage, publisher, service: createEvidenceService({ repository, storage, publisher }) };
};

describe("Phase 17 evidence service", () => {
  test("uploads incident evidence for the affected tourist", async () => {
    const { service, repository, storage, publisher } = setup();
    const result = await service.upload(tourist, { incidentId: incident.id }, file);
    expect(storage.put).toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ incidentId: incident.id, targetType: "INCIDENT", kind: "IMAGE", checksumSha256: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(publisher.publishEvidenceCreated).toHaveBeenCalled();
    expect(result.storageKey).toBe("stored-key");
  });

  test("prevents an unrelated tourist from reading incident evidence", async () => {
    const attachment = { id: "77777777-7777-4777-8777-777777777777", incidentId: incident.id, hazardId: null };
    const { service } = setup({ findById: jest.fn().mockResolvedValue(attachment), findTripContext: jest.fn().mockResolvedValue(null) });
    await expect(service.get(outsider, attachment.id)).rejects.toMatchObject({ code: "INCIDENT_NOT_FOUND" });
  });

  test("allows the hazard reporter to upload evidence", async () => {
    const { service, repository } = setup();
    await service.upload(tourist, { hazardId: hazard.id }, { ...file, mimetype: "application/pdf", originalname: "report.pdf" });
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ hazardId: hazard.id, targetType: "HAZARD", kind: "DOCUMENT" }));
  });

  test("locks evidence uploads for closed incidents", async () => {
    const { service } = setup({ findIncident: jest.fn().mockResolvedValue({ ...incident, status: "RESOLVED" }) });
    await expect(service.upload(tourist, { incidentId: incident.id }, file)).rejects.toMatchObject({ code: "INCIDENT_EVIDENCE_CLOSED" });
  });

  test("lets staff read linked evidence", async () => {
    const attachment = { id: "77777777-7777-4777-8777-777777777777", incidentId: incident.id, hazardId: null, storageKey: "stored-key", mimeType: "image/jpeg", originalName: "proof.jpg" };
    const { service, storage } = setup({ findById: jest.fn().mockResolvedValue(attachment) });
    const result = await service.content(manager, attachment.id);
    expect(storage.get).toHaveBeenCalledWith("stored-key");
    expect(result.buffer).toEqual(Buffer.from("evidence"));
  });

  test("only uploader or system admin can delete evidence", async () => {
    const attachment = { id: "77777777-7777-4777-8777-777777777777", incidentId: incident.id, hazardId: null, storageKey: "stored-key", uploaderId: tourist.id, uploaderRole: tourist.role };
    const { service } = setup({ findById: jest.fn().mockResolvedValue(attachment) });
    await expect(service.remove(manager, attachment.id)).rejects.toMatchObject({ code: "EVIDENCE_DELETE_FORBIDDEN" });
  });
});
