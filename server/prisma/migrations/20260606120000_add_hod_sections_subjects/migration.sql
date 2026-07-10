-- Add HOD to Role enum
ALTER TYPE "Role" ADD VALUE 'HOD';

-- Section
CREATE TABLE "Section" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "semester" INTEGER NOT NULL,
  "academicYear" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- Subject
CREATE TABLE "Subject" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "totalSlots" INTEGER NOT NULL DEFAULT 10,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- Add sectionId to User
ALTER TABLE "User" ADD COLUMN "sectionId" TEXT;
ALTER TABLE "User" ADD COLUMN "department" TEXT;

-- SubjectAssignment
CREATE TABLE "SubjectAssignment" (
  "id" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "facultyId" TEXT NOT NULL,
  "hodId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubjectAssignment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SubjectAssignment_sectionId_subjectId_key" ON "SubjectAssignment"("sectionId", "subjectId");

-- ExperimentSlot
CREATE TABLE "ExperimentSlot" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "slotNumber" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "maxMarks" INTEGER NOT NULL DEFAULT 10,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExperimentSlot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExperimentSlot_assignmentId_slotNumber_key" ON "ExperimentSlot"("assignmentId", "slotNumber");

-- StudentLabRecord
CREATE TABLE "StudentLabRecord" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "marks" INTEGER,
  "maxMarks" INTEGER NOT NULL DEFAULT 10,
  "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewNote" TEXT,
  CONSTRAINT "StudentLabRecord_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudentLabRecord_studentId_slotId_key" ON "StudentLabRecord"("studentId", "slotId");

-- Foreign keys
ALTER TABLE "User" ADD CONSTRAINT "User_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_hodId_fkey" FOREIGN KEY ("hodId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExperimentSlot" ADD CONSTRAINT "ExperimentSlot_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "SubjectAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentLabRecord" ADD CONSTRAINT "StudentLabRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentLabRecord" ADD CONSTRAINT "StudentLabRecord_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "SubjectAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StudentLabRecord" ADD CONSTRAINT "StudentLabRecord_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ExperimentSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
