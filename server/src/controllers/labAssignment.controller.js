const prisma = require('../utils/prisma');

// ── Faculty: get their assigned subjects ───────────────────────────────────

async function getMyAssignments(req, res) {
  try {
    const assignments = await prisma.subjectAssignment.findMany({
      where: { facultyId: req.user.id },
      include: {
        section: true,
        subject: true,
        experiments: { orderBy: { slotNumber: 'asc' } },
        _count: { select: { labRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAssignmentDetail(req, res) {
  try {
    const assignment = await prisma.subjectAssignment.findFirst({
      where: { id: req.params.id, facultyId: req.user.id },
      include: {
        section: { include: { students: { select: { id: true, name: true, email: true } } } },
        subject: true,
        experiments: { orderBy: { slotNumber: 'asc' } },
      },
    });
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Experiment Slots ──────────────────────────────────────────────────────────

async function upsertExperimentSlot(req, res) {
  try {
    const { slotNumber, title, description, maxMarks } = req.body;
    const { assignmentId } = req.params;

    if (!slotNumber || !title) {
      return res.status(400).json({ error: 'slotNumber and title are required' });
    }

    // Verify faculty owns this assignment
    const assignment = await prisma.subjectAssignment.findFirst({
      where: { id: assignmentId, facultyId: req.user.id },
      include: { subject: true },
    });
    if (!assignment) return res.status(403).json({ error: 'Not authorized' });

    const slot = await prisma.experimentSlot.upsert({
      where: { assignmentId_slotNumber: { assignmentId, slotNumber: parseInt(slotNumber) } },
      update: { title, description: description || null, maxMarks: parseInt(maxMarks) || 10 },
      create: {
        assignmentId,
        slotNumber: parseInt(slotNumber),
        title,
        description: description || null,
        maxMarks: parseInt(maxMarks) || 10,
      },
    });
    res.json(slot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteExperimentSlot(req, res) {
  try {
    const { assignmentId, slotId } = req.params;
    const slot = await prisma.experimentSlot.findFirst({
      where: { id: slotId, assignmentId },
      include: { assignment: true },
    });
    if (!slot || slot.assignment.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.experimentSlot.delete({ where: { id: slotId } });
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Student Lab Records (faculty grading) ─────────────────────────────────────

async function getLabRecords(req, res) {
  try {
    const { assignmentId } = req.params;
    const assignment = await prisma.subjectAssignment.findFirst({
      where: { id: assignmentId, facultyId: req.user.id },
    });
    if (!assignment) return res.status(403).json({ error: 'Not authorized' });

    const records = await prisma.studentLabRecord.findMany({
      where: { assignmentId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        slot: { select: { id: true, slotNumber: true, title: true, maxMarks: true } },
      },
      orderBy: [{ slot: { slotNumber: 'asc' } }, { submittedAt: 'desc' }],
    });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function reviewLabRecord(req, res) {
  try {
    const { marks, reviewNote } = req.body;
    const record = await prisma.studentLabRecord.findUnique({
      where: { id: req.params.recordId },
      include: {
        assignment: {
          include: { section: true },
        },
        slot: true,
        student: { select: { id: true, name: true } },
      },
    });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    if (record.assignment.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (marks !== undefined && (marks < 0 || marks > record.slot.maxMarks)) {
      return res.status(400).json({ error: `Marks must be between 0 and ${record.slot.maxMarks}` });
    }
    const updated = await prisma.studentLabRecord.update({
      where: { id: req.params.recordId },
      data: {
        marks: marks !== undefined ? parseInt(marks) : undefined,
        reviewNote: reviewNote || null,
        status: 'REVIEWED',
        reviewedAt: new Date(),
      },
    });

    // ── Emit real-time marks update to the student ──────────────────────────
    const io = req.app.get('io');
    if (io) {
      // Notify the specific student's room about their updated marks
      io.to(`student:${record.studentId}`).emit('marks_updated', {
        assignmentId: record.assignmentId,
        slotId: record.slotId,
        recordId: record.id,
        marks: updated.marks,
        maxMarks: record.slot.maxMarks,
        reviewNote: updated.reviewNote,
        status: updated.status,
        reviewedAt: updated.reviewedAt,
      });
    }
    // ── End real-time emit ──────────────────────────────────────────────────

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getMyAssignments,
  getAssignmentDetail,
  upsertExperimentSlot,
  deleteExperimentSlot,
  getLabRecords,
  reviewLabRecord,
};
