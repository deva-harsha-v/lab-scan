const prisma = require('../utils/prisma');
const { uploadFile } = require('../services/cloudinary.service');

async function createSubmission(req, res) {
  try {
    const { sessionCode, studentName, rollNumber, resultNotes } = req.body;

    if (!sessionCode || !rollNumber) {
      return res.status(400).json({
        error: 'sessionCode and rollNumber are required',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Observation photo is required' });
    }

    // Resolve student name(s) from roll number(s)
    const rollNumbers = rollNumber.split(',').map(r => r.trim()).filter(Boolean);
    const studentUsers = await Promise.all(
      rollNumbers.map(roll => prisma.user.findUnique({ where: { rollNumber: roll.toUpperCase() } }))
    );
    const resolvedNames = studentUsers
      .filter(Boolean)
      .map(u => u.name);
    // Use resolved names if found, otherwise fall back to provided studentName or roll numbers
    const resolvedStudentName = resolvedNames.length > 0
      ? resolvedNames.join(', ')
      : (studentName || rollNumbers.join(', '));

    // Find the session
    const session = await prisma.session.findUnique({
      where: { code: sessionCode.toUpperCase() },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'CLOSED') {
      return res.status(410).json({ error: 'This session has closed' });
    }

    if (session.status === 'DRAFT') {
      return res.status(400).json({ error: 'Session has not started yet' });
    }

    // Whitelist (instead of blacklist) the statuses that may receive submissions —
    // safer if a new SessionStatus value is ever added later.
    if (!['ACTIVE', 'GRACE'].includes(session.status)) {
      return res.status(400).json({ error: 'Session is not currently accepting submissions' });
    }

    // Every roll number must resolve to a real, registered STUDENT account.
    // Previously an unrecognized roll number silently fell back to the
    // client-supplied name, letting anyone submit fabricated entries for
    // roll numbers that don't exist in the system at all.
    const unresolvedRolls = rollNumbers.filter((roll, i) => !studentUsers[i] || studentUsers[i].role !== 'STUDENT');
    if (unresolvedRolls.length > 0) {
      return res.status(404).json({
        error: `Roll number(s) not recognized: ${unresolvedRolls.join(', ')}`,
      });
    }

    // Normalize roll number string before the duplicate check so that
    // "22cs001, 22cs002" and "22CS001,22CS002" are treated as the same entry.
    const normalizedRollNumber = rollNumbers.map(r => r.toUpperCase()).sort().join(', ');

    // Check for duplicate submission (same roll number in same session).
    // We do an early DB check for a friendly error message, but the real
    // guard is the @@unique constraint on (sessionId, rollNumber) which
    // prevents race conditions when multiple requests arrive simultaneously.
    if (!session.allowResubmit) {
      const existing = await prisma.submission.findFirst({
        where: { sessionId: session.id, rollNumber: normalizedRollNumber },
      });
      if (existing) {
        return res.status(409).json({
          error: 'You have already submitted for this session',
        });
      }
    }

    // Upload observation photo to Cloudinary
    const photoUrl = await uploadFile(req.file.buffer);

    let submission;
    try {
      if (session.allowResubmit) {
        // Upsert: update existing or create new when resubmission is allowed
        submission = await prisma.submission.upsert({
          where: { unique_submission_per_session: { sessionId: session.id, rollNumber: normalizedRollNumber } },
          update: {
            studentName: resolvedStudentName,
            observationPhotoUrl: photoUrl,
            resultNotes: resultNotes || null,
            submittedAt: new Date(),
            marks: null,
            reviewNote: null,
            reviewedAt: null,
            reviewedBy: null,
          },
          create: {
            sessionId: session.id,
            studentName: resolvedStudentName,
            rollNumber: normalizedRollNumber,
            observationPhotoUrl: photoUrl,
            resultNotes: resultNotes || null,
          },
        });
      } else {
        submission = await prisma.submission.create({
          data: {
            sessionId: session.id,
            studentName: resolvedStudentName,
            rollNumber: normalizedRollNumber,
            observationPhotoUrl: photoUrl,
            resultNotes: resultNotes || null,
          },
        });
      }
    } catch (dbErr) {
      // Unique constraint violation — concurrent duplicate submission
      if (dbErr.code === 'P2002') {
        return res.status(409).json({ error: 'You have already submitted for this session' });
      }
      throw dbErr;
    }

    // Emit real-time event to faculty watching this session
    const io = req.app.get('io');
    if (io) {
      // Get updated count
      const count = await prisma.submission.count({ where: { sessionId: session.id } });
      io.to(`session:${session.id}`).emit('new_submission', {
        sessionId: session.id,
        submissionCount: count,
        submission: {
          id: submission.id,
          studentName: submission.studentName,
          rollNumber: submission.rollNumber,
          submittedAt: submission.submittedAt,
        },
      });
    }

    // ── Mark experiment completed on the student's account ──────────────────
    // Parse experimentNumber from resultNotes if present
    let experimentNumberStr = null;
    if (submission.resultNotes) {
      try {
        const parsed = JSON.parse(submission.resultNotes);
        experimentNumberStr = parsed.experimentNumber ? String(parsed.experimentNumber) : null;
      } catch (_) { /* resultNotes is plain text, ignore */ }
    }

    if (experimentNumberStr) {
      // Roll numbers submitted may be comma-separated (group submissions)
      const rollNums = rollNumber.split(',').map(r => r.trim()).filter(Boolean);
      for (const roll of rollNums) {
        const student = await prisma.user.findUnique({ where: { rollNumber: roll.toUpperCase() } });
        if (student) {
          // Find the session's experiment slot matching this experiment number
          // The session links to an Experiment (legacy) whose arucoId can map to a slot title
          // Try to find a StudentLabRecord slot where slotNumber matches experimentNumber
          const slotNumber = parseInt(experimentNumberStr, 10);
          if (!isNaN(slotNumber)) {
            // Find the student's assignment and the corresponding slot
            const matchingSlot = await prisma.experimentSlot.findFirst({
              where: {
                slotNumber,
                assignment: { section: { students: { some: { id: student.id } } } },
              },
              include: { assignment: true },
            });

            if (matchingSlot) {
              const alreadyRecorded = await prisma.studentLabRecord.findUnique({
                where: { studentId_slotId: { studentId: student.id, slotId: matchingSlot.id } },
              });
              if (!alreadyRecorded) {
                await prisma.studentLabRecord.create({
                  data: {
                    studentId: student.id,
                    assignmentId: matchingSlot.assignmentId,
                    slotId: matchingSlot.id,
                    maxMarks: matchingSlot.maxMarks,
                    status: 'SUBMITTED',
                  },
                });
                // Notify the student's dashboard in real-time that exp is now SUBMITTED
                if (io) {
                  io.to(`student:${student.id}`).emit('experiment_completed', {
                    assignmentId: matchingSlot.assignmentId,
                    slotId: matchingSlot.id,
                    slotNumber,
                  });
                }
              }
            }
          }
        }
      }
    }
    // ── End experiment completion marking ───────────────────────────────────

    res.status(201).json({
      message: 'Submission received successfully',
      submissionId: submission.id,
    });
  } catch (err) {
    console.error('CreateSubmission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSubmissionsBySession(req, res) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const submissions = await prisma.submission.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { submittedAt: 'desc' },
    });

    res.json(submissions);
  } catch (err) {
    console.error('GetSubmissionsBySession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSubmissionById(req, res) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        session: {
          select: { id: true, code: true, facultyId: true },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Ownership check: a FACULTY account may only view submissions for
    // sessions it owns. HOD/ADMIN can view any (oversight roles).
    if (req.user.role === 'FACULTY' && submission.session.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this submission' });
    }
    if (!['FACULTY', 'HOD', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to view this submission' });
    }

    res.json(submission);
  } catch (err) {
    console.error('GetSubmissionById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function reviewSubmission(req, res) {
  try {
    const { marks, reviewNote } = req.body;

    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { session: { select: { facultyId: true, id: true } } },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.session.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to review this submission' });
    }

    if (marks !== undefined) {
      let maxMarks = 100;
      const student = await prisma.user.findUnique({ where: { rollNumber: submission.rollNumber.toUpperCase() } });
      if (student) {
        const record = await prisma.studentLabRecord.findFirst({
          where: { studentId: student.id },
          include: { slot: true },
          orderBy: { submittedAt: 'desc' },
        });
        if (record?.slot?.maxMarks) maxMarks = record.slot.maxMarks;
      }
      if (marks < 0 || marks > maxMarks) {
        return res.status(400).json({ error: `Marks must be between 0 and ${maxMarks}` });
      }
    }

    const parsedMarks = marks !== undefined ? parseInt(marks) : undefined;

    const updated = await prisma.submission.update({
      where: { id: req.params.id },
      data: {
        marks: parsedMarks,
        reviewNote: reviewNote !== undefined ? reviewNote : undefined,
        reviewedAt: new Date(),
        reviewedBy: req.user.name,
      },
    });

    // ── Sync marks to StudentLabRecord ──────────────────────────────────────
    // Parse experimentNumber from resultNotes to find the matching slot
    let experimentNumberStr = null;
    if (submission.resultNotes) {
      try {
        const parsed = JSON.parse(submission.resultNotes);
        experimentNumberStr = parsed.experimentNumber ? String(parsed.experimentNumber) : null;
      } catch (_) { /* plain text, ignore */ }
    }

    const io = req.app.get('io');

    if (experimentNumberStr && parsedMarks !== undefined) {
      const rollNumbers = submission.rollNumber.split(',').map(r => r.trim()).filter(Boolean);

      for (const roll of rollNumbers) {
        const student = await prisma.user.findUnique({ where: { rollNumber: roll.toUpperCase() } });
        if (!student) continue;

        const slotNumber = parseInt(experimentNumberStr, 10);
        if (isNaN(slotNumber)) continue;

        // Find the matching ExperimentSlot in the student's section
        const matchingSlot = await prisma.experimentSlot.findFirst({
          where: {
            slotNumber,
            assignment: { section: { students: { some: { id: student.id } } } },
          },
          include: { assignment: true },
        });

        if (!matchingSlot) continue;

        // Upsert StudentLabRecord with marks and REVIEWED status
        const labRecord = await prisma.studentLabRecord.upsert({
          where: { studentId_slotId: { studentId: student.id, slotId: matchingSlot.id } },
          update: {
            marks: parsedMarks,
            reviewNote: reviewNote || null,
            status: 'REVIEWED',
            reviewedAt: new Date(),
          },
          create: {
            studentId: student.id,
            assignmentId: matchingSlot.assignmentId,
            slotId: matchingSlot.id,
            maxMarks: matchingSlot.maxMarks,
            marks: parsedMarks,
            reviewNote: reviewNote || null,
            status: 'REVIEWED',
            reviewedAt: new Date(),
          },
        });

        // Emit real-time update to the student
        if (io) {
          io.to(`student:${student.id}`).emit('marks_updated', {
            assignmentId: matchingSlot.assignmentId,
            slotId: matchingSlot.id,
            recordId: labRecord.id,
            marks: parsedMarks,
            maxMarks: matchingSlot.maxMarks,
            reviewNote: reviewNote || null,
            status: 'REVIEWED',
            reviewedAt: new Date(),
          });
        }
      }
    }
    // ── End sync ─────────────────────────────────────────────────────────────

    res.json(updated);
  } catch (err) {
    console.error('ReviewSubmission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createSubmission,
  getSubmissionsBySession,
  getSubmissionById,
  reviewSubmission,
};
