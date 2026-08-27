import { pool } from "./db.js";

export interface PrivateUserContext {
  identity: {
    name: string | null;
    username: string | null;
    role: string;
  };
  profile?: {
    nationality?: string | null;
    preferredLanguage?: string | null;
  };
  organization?: {
    name?: string | null;
    department?: string | null;
    jurisdiction?: string | null;
    serviceType?: string | null;
  };
  currentTrip?: {
    id: string;
    destination: string;
    type: string;
    status: string;
    plannedStartAt: string;
    plannedEndAt: string;
    startedAt: string | null;
    group?: {
      name: string;
      role: string;
      status: string;
    } | null;
  } | null;
}

function normalizedRole(role: string | null | undefined): string {
  return String(role || "").trim().toUpperCase();
}

/**
 * Fetch a deliberately-minimized, per-user context for Rakshak AI.
 *
 * Privacy rules:
 * - accountId comes only from the verified access token.
 * - no password hashes, government IDs, medical history, reset/session tokens,
 *   emergency contacts, precise stored home/fleet coordinates, or audit records.
 * - returned data is used only in the current authenticated model request.
 * - it is never inserted into the shared/static knowledge base.
 */
export async function fetchPrivateUserContext(
  accountId: string,
  roleClaim: string | null | undefined,
): Promise<PrivateUserContext | null> {
  const role = normalizedRole(roleClaim);

  if (role === "TOURIST") {
    const userResult = await pool.query(
      `SELECT id, name, username, nationality, "preferredLanguage"
         FROM users
        WHERE id = $1
        LIMIT 1`,
      [accountId],
    );

    if (!userResult.rowCount) return null;
    const user = userResult.rows[0];

    const tripResult = await pool.query(
      `SELECT id,
              "locationName",
              "tripType",
              status,
              "plannedStartAt",
              "plannedEndAt",
              "startedAt"
         FROM trips
        WHERE "touristId" = $1
          AND status IN ('ACTIVE', 'PLANNED')
        ORDER BY
          CASE WHEN status = 'ACTIVE' THEN 0 ELSE 1 END,
          "plannedStartAt" DESC
        LIMIT 1`,
      [accountId],
    );

    let currentTrip: PrivateUserContext["currentTrip"] = null;

    if (tripResult.rowCount) {
      const trip = tripResult.rows[0];

      const groupResult = await pool.query(
        `SELECT g.name,
                g.status,
                gm.role
           FROM trip_groups g
           JOIN group_members gm
             ON gm."groupId" = g.id
          WHERE g."tripId" = $1
            AND gm."userId" = $2
            AND gm."leftAt" IS NULL
          LIMIT 1`,
        [trip.id, accountId],
      );

      const group = groupResult.rowCount
        ? {
            name: groupResult.rows[0].name,
            role: groupResult.rows[0].role,
            status: groupResult.rows[0].status,
          }
        : null;

      currentTrip = {
        id: trip.id,
        destination: trip.locationName,
        type: trip.tripType,
        status: trip.status,
        plannedStartAt: new Date(trip.plannedStartAt).toISOString(),
        plannedEndAt: new Date(trip.plannedEndAt).toISOString(),
        startedAt: trip.startedAt ? new Date(trip.startedAt).toISOString() : null,
        group,
      };
    }

    return {
      identity: {
        name: user.name ?? null,
        username: user.username ?? null,
        role,
      },
      profile: {
        nationality: user.nationality ?? null,
        preferredLanguage: user.preferredLanguage ?? null,
      },
      currentTrip,
    };
  }

  if (role === "DISASTER_MANAGER") {
    const result = await pool.query(
      `SELECT name, username, organization, department, jurisdiction
         FROM disaster_managers
        WHERE id = $1
        LIMIT 1`,
      [accountId],
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      identity: { name: row.name ?? null, username: row.username ?? null, role },
      organization: {
        name: row.organization ?? null,
        department: row.department ?? null,
        jurisdiction: row.jurisdiction ?? null,
      },
    };
  }

  if (role === "SYSTEM_ADMIN") {
    const result = await pool.query(
      `SELECT name, username
         FROM system_admins
        WHERE id = $1
        LIMIT 1`,
      [accountId],
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      identity: { name: row.name ?? null, username: row.username ?? null, role },
    };
  }

  if (["POLICE", "FIRE", "AMBULANCE"].includes(role)) {
    const result = await pool.query(
      `SELECT name, username, organization, jurisdiction, "serviceType"
         FROM emergency_service_accounts
        WHERE id = $1
        LIMIT 1`,
      [accountId],
    );
    if (!result.rowCount) return null;
    const row = result.rows[0];
    return {
      identity: { name: row.name ?? null, username: row.username ?? null, role },
      organization: {
        name: row.organization ?? null,
        jurisdiction: row.jurisdiction ?? null,
        serviceType: row.serviceType ?? null,
      },
    };
  }

  return null;
}
