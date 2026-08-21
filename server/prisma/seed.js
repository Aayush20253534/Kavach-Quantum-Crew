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
  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const data = await accountData({
      name: "System Admin",
      username: process.env.SEED_ADMIN_USERNAME ?? "system.admin",
      email: process.env.SEED_ADMIN_EMAIL,
      phone: process.env.SEED_ADMIN_PHONE ?? "+910000000001",
      password: process.env.SEED_ADMIN_PASSWORD,
    });
    await prisma.systemAdmin.upsert({
      where: { email: data.email },
      update: { ...data, passwordHash: undefined },
      create: data,
    });
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
