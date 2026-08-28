import express from "express";
import { buildTripResponse } from "./tripPlanner.js";

const router = express.Router();

/**
 * POST /plan  (mount this router at e.g. app.use("/api/trip", tripRouter)
 * so the full path becomes POST /api/trip/plan)
 *
 * Body:
 * {
 *   "city": "Allahabad",
 *   "num_days": 3,
 *   "check_in": "2026-09-10",   // optional, YYYY-MM-DD
 *   "check_out": "2026-09-13"   // optional, YYYY-MM-DD
 * }
 */
router.post("/plan", async (req, res) => {
  try {
    const { city, num_days, check_in, check_out } = req.body ?? {};

    if (!city || typeof city !== "string") {
      return res.status(400).json({ error: "'city' (string) is required" });
    }

    if (!num_days || typeof num_days !== "number" || num_days < 1) {
      return res
        .status(400)
        .json({ error: "'num_days' (positive number) is required" });
    }

    const tripResponse = await buildTripResponse(
      city,
      num_days,
      check_in ?? null,
      check_out ?? null
    );

    return res.status(200).json(tripResponse);
  } catch (err) {
    console.error("Error building trip response:", err);
    return res.status(500).json({
      error: "Failed to generate trip plan",
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;