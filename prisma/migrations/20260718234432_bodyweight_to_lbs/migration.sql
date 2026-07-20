-- Rename bodyweightKg to bodyweightLbs and convert existing values from kg to lbs
ALTER TABLE "User" RENAME COLUMN "bodyweightKg" TO "bodyweightLbs";
UPDATE "User" SET "bodyweightLbs" = "bodyweightLbs" * 2.2046226218;
