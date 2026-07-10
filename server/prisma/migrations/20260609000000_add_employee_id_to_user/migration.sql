-- AlterTable: add employeeId column to User (nullable, unique)
-- Required for FACULTY and HOD accounts (equivalent of rollNumber for students)
ALTER TABLE "User" ADD COLUMN "employeeId" TEXT;
CREATE UNIQUE INDEX "User_employeeId_key" ON "User"("employeeId");
