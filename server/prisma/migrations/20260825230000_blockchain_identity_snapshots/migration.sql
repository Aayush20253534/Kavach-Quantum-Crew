-- Immutable trip identity/group snapshot support.
ALTER TABLE "users" ADD COLUMN "dateOfBirth" TIMESTAMP(3);
ALTER TABLE "trip_groups" ADD COLUMN "name" VARCHAR(160);

UPDATE "trip_groups" g
SET "name" = COALESCE(u."name", 'Kavach') || ' Group'
FROM "users" u
WHERE g."leaderId" = u."id" AND g."name" IS NULL;

ALTER TABLE "trip_groups" ALTER COLUMN "name" SET NOT NULL;
