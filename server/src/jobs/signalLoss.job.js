import cron from "node-cron";
import { logger } from "../config/logger.js";
import { signalLossService } from "../modules/signal-loss/signal-loss.service.js";

export const createSignalLossJob = ({ service = signalLossService, log = logger } = {}) => {
  let task = null;
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try { await service.sweep(); }
    catch (error) { log.error({ err: error }, "Signal-loss escalation sweep failed"); }
    finally { running = false; }
  };
  return {
    start() {
      if (task) return task;
      task = cron.schedule("*/30 * * * * *", () => void tick());
      void tick();
      return task;
    },
    stop() { task?.stop(); task = null; },
    tick,
  };
};
export const signalLossJob = createSignalLossJob();
export default signalLossJob;
