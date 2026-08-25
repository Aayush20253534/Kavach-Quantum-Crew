import cron from "node-cron";
import { blockchainIntegrityService } from "../integrations/blockchain/blockchain.integrity.service.js";

let task;
let running = false;

export const blockchainIntegrityJob = Object.freeze({
  start() {
    if (task) return;
    task = cron.schedule("*/5 * * * * *", async () => {
      if (running) return;
      running = true;
      try {
        await blockchainIntegrityService.reconcileAllOpen();
      } finally {
        running = false;
      }
    });
  },
  stop() { task?.stop(); task = undefined; running = false; },
});
