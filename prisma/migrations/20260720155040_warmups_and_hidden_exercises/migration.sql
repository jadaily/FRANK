-- AlterTable
ALTER TABLE "SetLog" ADD COLUMN     "setType" TEXT NOT NULL DEFAULT 'working';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hiddenExercises" TEXT[] DEFAULT ARRAY[]::TEXT[];
