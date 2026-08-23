import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL or DIRECT_URL is required for seeding");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const accountData = async ({ name, username, email, phone, password }) => ({
  name,
  username: username.toLowerCase(),
  email: email.toLowerCase(),
  phone,
  passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
  status: "ACTIVE",
});

try {

  const destinations = [
    { slug: "prayagraj", name: "Prayagraj", state: "Uttar Pradesh", latitude: 25.4358, longitude: 81.8463, description: "Sangam city and major pilgrimage destination", sortOrder: 1 },
    { slug: "lucknow", name: "Lucknow", state: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462, description: "Capital city of Uttar Pradesh", sortOrder: 2 },
    { slug: "kanpur", name: "Kanpur", state: "Uttar Pradesh", latitude: 26.4499, longitude: 80.3319, description: "Major industrial city on the Ganga", sortOrder: 3 },
    { slug: "delhi", name: "Delhi", state: "Delhi", latitude: 28.6139, longitude: 77.2090, description: "National Capital Territory of Delhi", sortOrder: 4 },
  ];

  for (const destination of destinations) {
    await prisma.destination.upsert({
      where: { slug: destination.slug },
      update: destination,
      create: destination,
    });
  }
  // System Admin seed
  //
  // Local/development seeding works out of the box so a fresh clone can open
  // the admin console immediately. Production never falls back to demo
  // credentials: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD explicitly.
  const isProduction = process.env.NODE_ENV === "production";
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ||
    (!isProduction ? "admin@quantumcrew.local" : null);
  const adminPassword =
    process.env.SEED_ADMIN_PASSWORD ||
    (!isProduction ? "QuantumAdmin@123" : null);

  if (adminEmail && adminPassword) {
    const data = await accountData({
      name: process.env.SEED_ADMIN_NAME ?? "System Admin",
      username: process.env.SEED_ADMIN_USERNAME ?? "system.admin",
      email: adminEmail,
      phone: process.env.SEED_ADMIN_PHONE ?? "9000000001",
      password: adminPassword,
    });

    await prisma.systemAdmin.upsert({
      where: { username: data.username },
      update: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash: data.passwordHash,
        status: "ACTIVE",
      },
      create: data,
    });

    console.info(
      `[seed] System Admin ready: ${data.username} (${data.email})`,
    );
  } else {
    console.info(
      "[seed] System Admin skipped. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to seed one in production.",
    );
  }

  if (process.env.SEED_DM_EMAIL && process.env.SEED_DM_PASSWORD) {
    const data = await accountData({
      name: "Disaster Manager",
      username: process.env.SEED_DM_USERNAME ?? "disaster.manager",
      email: process.env.SEED_DM_EMAIL,
      phone: process.env.SEED_DM_PHONE ?? "+910000000002",
      password: process.env.SEED_DM_PASSWORD,
    });
    await prisma.disasterManager.upsert({
      where: { email: data.email },
      update: { ...data, passwordHash: undefined },
      create: data,
    });
  }
} finally {
  await prisma.$disconnect();
}
