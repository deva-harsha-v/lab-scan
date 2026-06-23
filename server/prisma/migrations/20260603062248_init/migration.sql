-- Add VIRTUAL_LAB to ContentType enum
ALTER TYPE "ContentType" ADD VALUE 'VIRTUAL_LAB';

-- Make Session.experimentId optional (nullable)
ALTER TABLE "Session" DROP CONSTRAINT "Session_experimentId_fkey";

ALTER TABLE "Session" ALTER COLUMN "experimentId" DROP NOT NULL;

ALTER TABLE "Session" ADD CONSTRAINT "Session_experimentId_fkey"
  FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
