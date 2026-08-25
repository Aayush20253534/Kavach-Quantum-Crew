import { environment } from "../config/environment.js";
import { logger } from "../config/logger.js";
import { blockchainQueue } from "../integrations/blockchain/blockchain.queue.js";

let timer;
let running = false;
export const blockchainAnchorJob = Object.freeze({
  start() {
    if (timer || !environment.BLOCKCHAIN_ENABLED) return;
    const tick = async () => {
      if (running) return;
      running = true;
      try {
        for (let i = 0; i < 10 && (await blockchainQueue.processNext()); i += 1) {}
      } catch (error) {
        logger.error({ err: error }, "Blockchain anchor worker failed");
      } finally { running = false; }
    };
    timer = setInterval(() => void tick(), environment.BLOCKCHAIN_WORKER_INTERVAL_MS);
    timer.unref?.();
    void tick();
  },
  stop() { if (timer) clearInterval(timer); timer = undefined; },
});
