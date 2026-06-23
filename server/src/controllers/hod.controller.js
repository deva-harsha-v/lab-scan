const prisma = require('../utils/prisma');

// ── Sections ──────────────────────────────────────────────────────────────────

async function createSection(req, res) {
  try {
    const { name, department, semester, academicYear } = req.body;
    if (!name || !department || !semester || !academicYear) {
      return res.status(400).json({ error: 'name, department, semester, academicYear are required' });
    }

    // Force strict alignment to the HOD's own department
    if (department !== req.user.department) {
      return res.status(403).json({ error: `Not authorized. Your department is locked to: ${req.user.department}` });
    }

    const section = await prisma.section.create({
      data: { name, department, semester: parseInt(semester), academicYear },
    });
    res.status(201).json(section);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Section already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSections(req, res) {
  try {
    // Sandboxed filter: HODs only see sections belonging to their specific department
    const sections = await prisma.section.findMany({
      where: { department: req.user.department },
      include: {
        _count: { select: { students: true, assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(sections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSectionById(req, res) {
  try {
    const section = await prisma.section.findUnique({
      where: { id: req.params.id },
      include: {
        students: { select: { id: true, name: true, email: true } },
        assignments: {
          include: {
            subject: true,
            faculty: { select: { id: true, name: true, email: true } },
            _count: { select: { experiments: true } },
          },
        },
      },
    });
    if (!section) return res.status(404).json({ error: 'Section not found' });
    
    // Security check: Block direct ID lookups for sections outside their department
    if (section.department !== req.user.department) {
      return res.status(403).json({ error: 'Access denied to this department segment.' });
    }

    res.json(section);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Subjects ──────────────────────────────────────────────────────────────────

async function createSubject(req, res) {
  try {
    const { name, code, department, totalSlots } = req.body;
    if (!name || !code || !department) {
      return res.status(400).json({ error: 'name, code, department are required' });
    }

    if (department !== req.user.department) {
      return res.status(403).json({ error: `Not authorized. Your department is locked to: ${req.user.department}` });
    }

    const subject = await prisma.subject.create({
      data: { name, code: code.toUpperCase(), department, totalSlots: parseInt(totalSlots) || 10 },
    });
    res.status(201).json(subject);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Subject code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSubjects(req, res) {
  try {
    // Filter subjects by HOD's department
    const subjects = await prisma.subject.findMany({
      where: { department: req.user.department },
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateSubject(req, res) {
  try {
    const { name, totalSlots } = req.body;
    
    const targetSubject = await prisma.subject.findUnique({ where: { id: req.params.id } });
    if (!targetSubject) return res.status(404).json({ error: 'Subject not found' });
    if (targetSubject.department !== req.user.department) {
      return res.status(403).json({ error: 'Not authorized to modify this department record.' });
    }

    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(totalSlots && { totalSlots: parseInt(totalSlots) }),
      },
    });
    res.json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Assignments ───────────────────────────────────────────────────────────────

async function createAssignment(req, res) {
  try {
    const { sectionId, subjectId, facultyId } = req.body;
    if (!sectionId || !subjectId || !facultyId) {
      return res.status(400).json({ error: 'sectionId, subjectId, facultyId are required' });
    }

    // Verify target section belongs to the HOD's department scope
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.department !== req.user.department) {
      return res.status(403).json({ error: 'Cannot assign a subject to a section outside your department.' });
    }

    // Verify target subject belongs to the HOD's department scope
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject || subject.department !== req.user.department) {
      return res.status(403).json({ error: 'Cannot assign a subject outside your department catalog.' });
    }

    const faculty = await prisma.user.findUnique({ where: { id: facultyId } });
    if (!faculty || (faculty.role !== 'FACULTY' && faculty.role !== 'HOD')) {
      return res.status(400).json({ error: 'Invalid faculty member' });
    }

    // Double check faculty belongs to same department to avoid mixing staffs
    if (faculty.department !== req.user.department) {
      return res.status(403).json({ error: 'Cannot route assignments to out-of-department faculty members.' });
    }

    const assignment = await prisma.subjectAssignment.create({
      data: { sectionId, subjectId, facultyId, hodId: req.user.id },
      include: {
        section: true,
        subject: true,
        faculty: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json(assignment);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'This section-subject combination is already assigned' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAssignments(req, res) {
  try {
    const assignments = await prisma.subjectAssignment.findMany({
      where: { hodId: req.user.id },
      include: {
        section: true,
        subject: true,
        faculty: { select: { id: true, name: true, email: true } },
        _count: { select: { experiments: true, labRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteAssignment(req, res) {
  try {
    const assignment = await prisma.subjectAssignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    if (assignment.hodId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this assignment' });
    }
    await prisma.subjectAssignment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Assignment removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getFacultyList(req, res) {
  try {
    // Department filtering ensures only departmental staff show up in the selection drop-downs
    const faculty = await prisma.user.findMany({
      where: { 
        role: { in: ['FACULTY', 'HOD'] },
        department: req.user.department
      },
      select: { id: true, name: true, email: true, department: true, role: true, employeeId: true },
      orderBy: { name: 'asc' },
    });
    res.json(faculty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Student Enrollment ────────────────────────────────────────────────────────

async function enrollStudent(req, res) {
  try {
    const { studentId, sectionId } = req.body;
    if (!studentId || !sectionId) {
      return res.status(400).json({ error: 'studentId and sectionId are required' });
    }

    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.department !== req.user.department) {
      return res.status(403).json({ error: 'Inaccessible section target endpoint.' });
    }

    const student = await prisma.user.update({
      where: { id: studentId },
      data: { sectionId },
      select: { id: true, name: true, email: true, sectionId: true },
    });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStudents(req, res) {
  try {
    // Display only students belonging to sections within this department, or unassigned buffer students
    const students = await prisma.user.findMany({
      where: { 
        role: 'STUDENT',
        OR: [
          { section: { department: req.user.department } },
          { sectionId: null }
        ]
      },
      select: { id: true, name: true, email: true, sectionId: true, section: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/hod/students/bulk-enroll
 * Assigns multiple students to a single section in one shot.
 * Protected: HOD only.
 */
async function bulkEnrollStudents(req, res) {
  try {
    const { studentIds, sectionId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: 'studentIds must be a non-empty array' });
    }
    if (!sectionId) {
      return res.status(400).json({ error: 'sectionId is required' });
    }

    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section || section.department !== req.user.department) {
      return res.status(403).json({ error: 'Inaccessible section target endpoint.' });
    }

    // Verify every targeted id is actually a STUDENT before touching anything
    const validStudents = await prisma.user.findMany({
      where: { id: { in: studentIds }, role: 'STUDENT' },
      select: { id: true },
    });
    const validIds = new Set(validStudents.map(s => s.id));
    const invalidId = studentIds.find(id => !validIds.has(id));
    if (invalidId) {
      return res.status(400).json({ error: 'One or more selected students could not be found.' });
    }

    const result = await prisma.user.updateMany({
      where: { id: { in: studentIds } },
      data: { sectionId },
    });

    res.json({ count: result.count });
  } catch (err) {
    console.error('BulkEnrollStudents error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Bulk Assignments ──────────────────────────────────────────────────────────

async function bulkCreateAssignments(req, res) {
  try {
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'assignments must be a non-empty array' });
    }

    for (const a of assignments) {
      if (!a.sectionId || !a.subjectId || !a.facultyId) {
        return res.status(400).json({ error: 'Each assignment requires sectionId, subjectId, facultyId' });
      }
    }

    // Verify all targets are within the HOD's department scope
    const facultyIds = [...new Set(assignments.map(a => a.facultyId))];
    const validFaculty = await prisma.user.findMany({
      where: { 
        id: { in: facultyIds }, 
        role: { in: ['FACULTY', 'HOD'] },
        department: req.user.department
      },
      select: { id: true },
    });
    const validIds = new Set(validFaculty.map(f => f.id));
    const invalidId = facultyIds.find(id => !validIds.has(id));
    if (invalidId) {
      return res.status(400).json({ error: `Invalid or out-of-department faculty member detected.` });
    }

    const created = await prisma.$transaction(
      assignments.map(a =>
        prisma.subjectAssignment.create({
          data: {
            sectionId: a.sectionId,
            subjectId: a.subjectId,
            facultyId: a.facultyId,
            hodId: req.user.id,
          },
          include: {
            section: true,
            subject: true,
            faculty: { select: { id: true, name: true, email: true } },
          },
        })
      )
    );

    res.status(201).json({ count: created.length, assignments: created });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'One or more section-subject combinations are already assigned' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── Scoped Dashboard Stats ────────────────────────────────────────────────────

async function getHodStats(req, res) {
  try {
    const [sections, subjects, assignments, faculty, students] = await Promise.all([
      prisma.section.count({ where: { department: req.user.department } }),
      prisma.subject.count({ where: { department: req.user.department } }),
      prisma.subjectAssignment.count({ where: { hodId: req.user.id } }),
      prisma.user.count({ where: { role: 'FACULTY', department: req.user.department } }),
      prisma.user.count({ where: { role: 'STUDENT', section: { department: req.user.department } } }),
    ]);
    res.json({ sections, subjects, assignments, faculty, students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { 
  bulkCreateAssignments,
  createSection, getSections, getSectionById,
  createSubject, getSubjects, updateSubject,
  createAssignment, getAssignments, deleteAssignment,
  getFacultyList, getHodStats,
  enrollStudent, getStudents, bulkEnrollStudents,
};