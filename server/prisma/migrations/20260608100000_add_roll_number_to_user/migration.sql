-- AlterTable: add rollNumber column to User (nullable, unique)
ALTER TABLE "User" ADD COLUMN "rollNumber" TEXT;
CREATE UNIQUE INDEX "User_rollNumber_key" ON "User"("rollNumber");
