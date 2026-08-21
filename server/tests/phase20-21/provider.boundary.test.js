import { createAiProvider } from "../../src/modules/integrations/ai.provider.js";
import { createBlockchainProvider } from "../../src/modules/integrations/blockchain.provider.js";

describe("Phase 20-21 provider boundaries", () => {
  test("fails closed when no AI provider is configured", async () => {
    const provider = createAiProvider();

    await expect(
      provider.riskAssessment({}),
    ).rejects.toMatchObject({
      statusCode: 501,
      code: "INTEGRATION_PROVIDER_NOT_CONFIGURED",
    });
  });

  test("fails closed when no blockchain provider is configured", async () => {
    const provider = createBlockchainProvider();

    await expect(
      provider.incidentProof({}),
    ).rejects.toMatchObject({
      statusCode: 501,
      code: "INTEGRATION_PROVIDER_NOT_CONFIGURED",
    });
  });
});
