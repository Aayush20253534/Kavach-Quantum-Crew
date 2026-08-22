import { createSosBodySchema } from "../../src/modules/sos/sos.validation.js";
import { incidentListQuerySchema,incidentResolutionBodySchema } from "../../src/modules/incident/incident.validation.js";
describe("Phase 8 validation",()=>{
 test("allows SOS to use stored location",()=>expect(createSosBodySchema.safeParse({tripId:"550e8400-e29b-41d4-a716-446655440000",emergencyType:"MEDICAL"}).success).toBe(true));
 test("requires coordinate pair",()=>expect(createSosBodySchema.safeParse({tripId:"550e8400-e29b-41d4-a716-446655440000",emergencyType:"LOST",latitude:25}).success).toBe(false));
 test("caps queue size",()=>expect(incidentListQuerySchema.safeParse({limit:101}).success).toBe(false));
 test("requires resolution note",()=>expect(incidentResolutionBodySchema.safeParse({}).success).toBe(false));
});
