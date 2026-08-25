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

  const dmEmail = process.env.SEED_DM_EMAIL || (!isProduction ? "disaster@quantumcrew.local" : null);
  const dmPassword = process.env.SEED_DM_PASSWORD || (!isProduction ? "QuantumDM@123" : null);

  if (dmEmail && dmPassword) {
    const dmData = await accountData({
      name: process.env.SEED_DM_NAME ?? "Prayagraj Disaster Manager",
      username: process.env.SEED_DM_USERNAME ?? "disaster.manager",
      email: dmEmail,
      phone: process.env.SEED_DM_PHONE ?? "9000000002",
      password: dmPassword,
    });
    const manager = await prisma.disasterManager.upsert({
      where: { username: dmData.username },
      update: { ...dmData, organization: "Prayagraj Integrated Command Centre", department: "Emergency Operations", jurisdiction: "Prayagraj", responderStatus: "AVAILABLE", maxActiveIncidents: 8 },
      create: { ...dmData, organization: "Prayagraj Integrated Command Centre", department: "Emergency Operations", jurisdiction: "Prayagraj", responderStatus: "AVAILABLE", maxActiveIncidents: 8 },
    });

    const tourist = await prisma.user.upsert({
      where: { username: "tourist.demo" },
      update: { status: "ACTIVE", onboardingCompleted: true },
      create: {
        name: "Demo Tourist", username: "tourist.demo", email: "tourist.demo@quantumcrew.local",
        phone: "9000000010", passwordHash: await argon2.hash("TouristDemo@123", { type: argon2.argon2id }),
        status: "ACTIVE", onboardingCompleted: true, nationality: "Indian", preferredLanguage: "English",
      },
    });

    const tripId = "10000000-0000-4000-8000-000000000001";
    await prisma.trip.upsert({
      where: { id: tripId },
      update: { status: "ACTIVE", locationName: "Prayagraj" },
      create: { id: tripId, touristId: tourist.id, locationName: "Prayagraj", tripType: "SOLO", status: "ACTIVE",
        plannedStartAt: new Date(Date.now() - 3600000), plannedEndAt: new Date(Date.now() + 28800000), startedAt: new Date(Date.now() - 3600000) },
    });

    for (const incident of [
      { id:"20000000-0000-4000-8000-000000000001", severity:"CRITICAL", title:"Medical SOS near Sangam", description:"Tourist requested urgent medical assistance near the Sangam area.", latitude:25.4298, longitude:81.8850 },
      { id:"20000000-0000-4000-8000-000000000002", severity:"DANGER", title:"Crowd separation alert", description:"Tourist reported separation from their group near Civil Lines.", latitude:25.4549, longitude:81.8347 },
    ]) {
      await prisma.incident.upsert({
        where:{id:incident.id},
        update:{...incident,status:"OPEN",assignedToId:manager.id,assignedToRole:"DISASTER_MANAGER",assignedAt:new Date()},
        create:{...incident,tripId,userId:tourist.id,sourceType:"SOS",status:"OPEN",assignedToId:manager.id,assignedToRole:"DISASTER_MANAGER",assignedAt:new Date()},
      });
    }

    for (const h of [
      {id:"30000000-0000-4000-8000-000000000001",type:"CROWD",severity:"HIGH",title:"Heavy crowd near Sangam",description:"High pedestrian density reported near the Sangam approach.",latitude:25.4305,longitude:81.8842,locationName:"Sangam"},
      {id:"30000000-0000-4000-8000-000000000002",type:"ROAD_BLOCK",severity:"MEDIUM",title:"Temporary road obstruction",description:"A temporary obstruction is slowing emergency access.",latitude:25.4484,longitude:81.8431,locationName:"Civil Lines"},
    ]) {
      await prisma.hazardReport.upsert({where:{id:h.id},update:{...h,status:"PENDING"},create:{...h,reporterId:tourist.id,reporterRole:"TOURIST",status:"PENDING",occurredAt:new Date()}});
    }

    for (const u of [
      {id:"40000000-0000-4000-8000-000000000001",name:"Civil Lines PCR-21",type:"POLICE",organization:"Prayagraj Police",contactPhone:"112"},
      {id:"40000000-0000-4000-8000-000000000002",name:"Kotwali PCR-12",type:"POLICE",organization:"Prayagraj Police",contactPhone:"112"},
      {id:"40000000-0000-4000-8000-000000000003",name:"Civil Lines Fire-03",type:"FIRE",organization:"Prayagraj Fire & Emergency Service",contactPhone:"101"},
      {id:"40000000-0000-4000-8000-000000000004",name:"Naini Fire-06",type:"FIRE",organization:"Prayagraj Fire & Emergency Service",contactPhone:"101"},
      {id:"40000000-0000-4000-8000-000000000005",name:"District Ambulance-07",type:"AMBULANCE",organization:"Prayagraj Emergency Medical Service",contactPhone:"108"},
      {id:"40000000-0000-4000-8000-000000000006",name:"Sangam Medical Response-02",type:"AMBULANCE",organization:"Prayagraj Emergency Medical Service",contactPhone:"108"},
    ]) {
      await prisma.emergencyUnit.upsert({where:{id:u.id},update:{...u,status:"AVAILABLE",jurisdiction:"Prayagraj"},create:{...u,status:"AVAILABLE",jurisdiction:"Prayagraj"}});
    }

    for (const z of [
      {id:"50000000-0000-4000-8000-000000000001",name:"Sangam Crowd Risk Zone",description:"Operational risk zone around Sangam.",type:"RISK",severity:"HIGH",geometryType:"CIRCLE",latitude:25.4300,longitude:81.8850,radiusM:650},
      {id:"50000000-0000-4000-8000-000000000002",name:"Civil Lines Safe Coordination Zone",description:"Safe emergency coordination area.",type:"SAFE",severity:"LOW",geometryType:"CIRCLE",latitude:25.4540,longitude:81.8340,radiusM:450},
    ]) {
      await prisma.safetyZone.upsert({where:{id:z.id},update:{...z,active:true,createdById:manager.id,createdByRole:"DISASTER_MANAGER"},create:{...z,active:true,createdById:manager.id,createdByRole:"DISASTER_MANAGER"}});
    }

    console.info(`[seed] Disaster Manager ready: ${dmData.username} (${dmData.email})`);
    console.info("[seed] Disaster demo data ready: incidents, hazards, emergency units and safety zones");
  } else {
    console.info("[seed] Disaster Manager skipped. Set SEED_DM_EMAIL and SEED_DM_PASSWORD in production.");
  }
} finally {
  await prisma.$disconnect();
}
