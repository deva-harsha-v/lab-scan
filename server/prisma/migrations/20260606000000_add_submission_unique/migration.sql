-- Add unique constraint to prevent duplicate submissions per session per student.
-- This is a race-condition-safe guard at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS "submission_session_roll_unique"
  ON "Submission" ("sessionId", "rollNumber");
