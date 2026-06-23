const prisma = require('../utils/prisma');

// ── Student Dashboard ─────────────────────────────────────────────────────────

async function getMyDashboard(req, res) {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        section: {
          include: {
            assignments: {
              include: {
                subject: true,
                faculty: { select: { id: true, name: true } },
                experiments: { orderBy: { slotNumber: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (!student.section) {
      return res.json({ student: { id: student.id, name: student.name, email: student.email }, section: null, labs: [] });
    }

    // Get lab records for this student
    const records = await prisma.studentLabRecord.findMany({
      where: { studentId: req.user.id },
      include: { slot: true },
    });

    const recordsBySlot = {};
    records.forEach(r => { recordsBySlot[r.slotId] = r; });

    const labs = student.section.assignments.map(assignment => {
      const experiments = assignment.experiments.map(slot => ({
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        title: slot.title,
        description: slot.description,
        maxMarks: slot.maxMarks,
        record: recordsBySlot[slot.id] || null,
      }));

      const completedCount = experiments.filter(e => e.record).length;
      const totalMarks = experiments.reduce((sum, e) => sum + (e.record?.marks || 0), 0);

      return {
        assignmentId: assignment.id,
        subject: assignment.subject,
        faculty: assignment.faculty,
        experiments,
        stats: {
          total: assignment.experiments.length,
          completed: completedCount,
          totalMarks,
          maxPossible: experiments.reduce((s, e) => s + e.maxMarks, 0),
        },
      };
    });

    res.json({
      student: { id: student.id, name: student.name, email: student.email },
      section: {
        id: student.section.id,
        name: student.section.name,
        department: student.section.department,
        semester: student.section.semester,
        academicYear: student.section.academicYear,
      },
      labs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Submit Experiment ─────────────────────────────────────────────────────────

async function submitExperiment(req, res) {
  try {
    const { assignmentId, slotId } = req.body;

    if (!assignmentId || !slotId) {
      return res.status(400).json({ error: 'assignmentId and slotId are required' });
    }

    // Verify the slot belongs to the assignment
    const slot = await prisma.experimentSlot.findFirst({
      where: { id: slotId, assignmentId },
      include: { assignment: { include: { section: true } } },
    });
    if (!slot) return res.status(404).json({ error: 'Experiment slot not found' });

    // Verify student is in this section
    const student = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (student.sectionId !== slot.assignment.sectionId) {
      return res.status(403).json({ error: 'You are not enrolled in this section' });
    }

    // Upsert — allow resubmission before grading
    const existing = await prisma.studentLabRecord.findUnique({
      where: { studentId_slotId: { studentId: req.user.id, slotId } },
    });

    if (existing && existing.status === 'REVIEWED') {
      return res.status(409).json({ error: 'This experiment has already been graded and cannot be resubmitted' });
    }

    const record = await prisma.studentLabRecord.upsert({
      where: { studentId_slotId: { studentId: req.user.id, slotId } },
      update: { submittedAt: new Date(), status: 'SUBMITTED' },
      create: {
        studentId: req.user.id,
        assignmentId,
        slotId,
        maxMarks: slot.maxMarks,
        submittedAt: new Date(),
        status: 'SUBMITTED',
      },
    });

    res.status(201).json({ message: 'Experiment submitted successfully', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Student: Get available experiment slots for a subject ─────────────────────

async function getLabDetail(req, res) {
  try {
    const { assignmentId } = req.params;

    const student = await prisma.user.findUnique({ where: { id: req.user.id } });

    const assignment = await prisma.subjectAssignment.findFirst({
      where: { id: assignmentId, sectionId: student.sectionId },
      include: {
        subject: true,
        faculty: { select: { id: true, name: true } },
        experiments: { orderBy: { slotNumber: 'asc' } },
      },
    });
    if (!assignment) return res.status(404).json({ error: 'Lab not found' });

    const records = await prisma.studentLabRecord.findMany({
      where: { studentId: req.user.id, assignmentId },
      include: { slot: true },
    });
    const bySlot = {};
    records.forEach(r => { bySlot[r.slotId] = r; });

    res.json({
      assignment: {
        id: assignment.id,
        subject: assignment.subject,
        faculty: assignment.faculty,
      },
      slots: assignment.experiments.map(slot => ({
        ...slot,
        record: bySlot[slot.id] || null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getMyDashboard, submitExperiment, getLabDetail };
