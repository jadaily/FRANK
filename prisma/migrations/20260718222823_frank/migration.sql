-- 1. Safely handle the RatingHistory adjustments
ALTER TABLE "RatingHistory" DROP COLUMN "delta", ADD COLUMN "isPlaced" BOOLEAN NOT NULL DEFAULT false;

-- 2. Add the required columns as NULLABLE first to avoid crashing on existing rows
ALTER TABLE "SetLog" ADD COLUMN "rpe" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "bodyweightKg" DOUBLE PRECISION;
ALTER TABLE "User" ADD COLUMN "sex" TEXT;

-- 3. Backfill fallback metrics for all 35 pre-existing rows
UPDATE "SetLog" SET "rpe" = 10.0 WHERE "rpe" IS NULL;
UPDATE "User" SET "bodyweightKg" = 80.0 WHERE "bodyweightKg" IS NULL;
UPDATE "User" SET "sex" = 'male' WHERE "sex" IS NULL;

-- 4. Enforce the strict NOT NULL constraints now that every row contains data
ALTER TABLE "SetLog" ALTER COLUMN "rpe" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "bodyweightKg" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "sex" SET NOT NULL;
