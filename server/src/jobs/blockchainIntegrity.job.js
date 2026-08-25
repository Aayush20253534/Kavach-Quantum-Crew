import cron from "node-cron";
import { blockchainIntegrityService } from "../integrations/blockchain/blockchain.integrity.service.js";

let task;
export const blockchainIntegrityJob = Object.freeze({
  start() {
    if (task) return;
    task = cron.schedule("*/1 * * * *", () => void blockchainIntegrityService.reconcileAllOpen());
  },
  stop() { task?.stop(); task = undefined; },
});
