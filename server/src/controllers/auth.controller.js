const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../utils/prisma');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Persists a refresh token (hashed) so it can be looked up / revoked server-side.
async function storeRefreshToken(token, userId) {
  const decoded = jwt.decode(token);
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });
}

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name, rollNumber: user.rollNumber, employeeId: user.employeeId, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

async function register(req, res) {
  try {
    const { name, email, password, role, rollNumber, employeeId, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const validRoles = ['FACULTY', 'STUDENT', 'HOD'];
    const userRole = role && validRoles.includes(role.toUpperCase())
      ? role.toUpperCase()
      : 'STUDENT';

    // Validate role-specific ID fields
    if (userRole === 'STUDENT') {
      if (!rollNumber || !rollNumber.toString().trim()) {
        return res.status(400).json({ error: 'Roll number is required for student accounts' });
      }
    }
    if (userRole === 'FACULTY' || userRole === 'HOD') {
      if (!employeeId || !employeeId.toString().trim()) {
        return res.status(400).json({ error: 'Employee ID is required for faculty and HOD accounts' });
      }
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (userRole === 'STUDENT' && rollNumber) {
      const rollExists = await prisma.user.findUnique({ where: { rollNumber: rollNumber.toString().trim().toUpperCase() } });
      if (rollExists) {
        return res.status(409).json({ error: 'Roll number already registered' });
      }
    }

    if ((userRole === 'FACULTY' || userRole === 'HOD') && employeeId) {
      const empExists = await prisma.user.findUnique({ where: { employeeId: employeeId.toString().trim().toUpperCase() } });
      if (empExists) {
        return res.status(409).json({ error: 'Employee ID already registered' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userRole,
        department: department || null,
        employeeId: (userRole === 'FACULTY' || userRole === 'HOD')
          ? employeeId.toString().trim().toUpperCase()
          : null,
        rollNumber: userRole === 'STUDENT'
          ? rollNumber.toString().trim().toUpperCase()
          : null,
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(refreshToken, user.id);

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId, rollNumber: user.rollNumber, department: user.department, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  try {
    // identifier = rollNumber (student) | employeeId (faculty/HOD) | email (admin fallback)
    // portalType = 'FACULTY' | 'STUDENT'
    const { identifier, password, portalType } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'ID and password are required' });
    }

    const id = identifier.trim().toUpperCase();

    // Find user by rollNumber, employeeId, or email (admin)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { rollNumber: id },
          { employeeId: id },
          { email: identifier.trim().toLowerCase() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Portal enforcement:
    // STUDENT portal → only STUDENT role allowed
    // FACULTY portal → FACULTY, HOD, ADMIN allowed
    if (portalType === 'STUDENT') {
      if (user.role !== 'STUDENT') {
        return res.status(403).json({ error: 'This account cannot log in through the Student portal. Please use the Faculty portal.' });
      }
    } else if (portalType === 'FACULTY') {
      if (user.role === 'STUDENT') {
        return res.status(403).json({ error: 'Student accounts cannot log in through the Faculty portal. Please use the Student portal.' });
      }
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await storeRefreshToken(refreshToken, user.id);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId, rollNumber: user.rollNumber },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Must exist, be unrevoked, and unexpired in the DB — this is what lets us
    // actually kill a stolen/long-lived (7-day) refresh token server-side.
    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate: revoke the used token, persist the new one.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    await storeRefreshToken(newRefreshToken, user.id);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

/**
 * POST /api/auth/logout
 * Revokes the given refresh token server-side so it can no longer be used,
 * even though the (short-lived) access token it was paired with stays valid
 * until it naturally expires in <=15 minutes.
 */
async function logout(req, res) {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/auth/change-password
 * Lets the currently authenticated user (any role) change their own password.
 * This matters most for students, since the university issues every student
 * the same default password on account creation/bulk import.
 * Protected: any authenticated user.
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the current password' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('ChangePassword error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ── NEW: Admin-only endpoints ──────────────────────────────────────────────

/**
 * GET /api/auth/users
 * Returns all non-admin users ordered by createdAt desc.
 * Protected: ADMIN only.
 */
async function getUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        employeeId: true,
        rollNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('GetUsers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/auth/users/:id
 * Deletes a user and all their related records (cascade manually).
 * Protected: ADMIN only.
 *
 * Deletion order (child → parent) to satisfy FK constraints:
 *  1. StudentLabRecord   (references User as student)
 *  2. Submission         (references Session, which references User as faculty)
 *  3. Session            (references User as faculty & Experiment)
 *  4. ExperimentContent  (references Experiment created by user)
 *  5. Experiment         (references User as createdBy)
 *  6. SubjectAssignment  (references User as faculty or HOD)
 *     → ExperimentSlot and StudentLabRecord on that assignment are
 *       already cascade-deleted by Prisma (onDelete: Cascade on assignmentId)
 *  7. User               (finally safe to delete)
 */
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot delete admin accounts' });
    }

    await prisma.$transaction(async (tx) => {

      // 1. Delete StudentLabRecords where this user is the student
      await tx.studentLabRecord.deleteMany({ where: { studentId: id } });

      // 2. Find all sessions created by this user (faculty), then delete their submissions
      const userSessions = await tx.session.findMany({
        where: { facultyId: id },
        select: { id: true },
      });
      const sessionIds = userSessions.map(s => s.id);
      if (sessionIds.length > 0) {
        await tx.submission.deleteMany({ where: { sessionId: { in: sessionIds } } });
      }

      // 3. Delete sessions created by this user
      await tx.session.deleteMany({ where: { facultyId: id } });

      // 4. Find experiments created by this user, delete their contents + sessions first
      const userExperiments = await tx.experiment.findMany({
        where: { createdById: id },
        select: { id: true },
      });
      const experimentIds = userExperiments.map(e => e.id);
      if (experimentIds.length > 0) {
        // Sessions that reference these experiments (created by OTHER faculty) — delete submissions first
        const expSessions = await tx.session.findMany({
          where: { experimentId: { in: experimentIds } },
          select: { id: true },
        });
        const expSessionIds = expSessions.map(s => s.id);
        if (expSessionIds.length > 0) {
          await tx.submission.deleteMany({ where: { sessionId: { in: expSessionIds } } });
          await tx.session.deleteMany({ where: { id: { in: expSessionIds } } });
        }
        await tx.experimentContent.deleteMany({ where: { experimentId: { in: experimentIds } } });
        await tx.experiment.deleteMany({ where: { createdById: id } });
      }

      // 5. Delete SubjectAssignments where user is faculty or HOD
      //    ExperimentSlot rows cascade via onDelete: Cascade
      //    StudentLabRecord rows on those assignments were already deleted in step 1
      await tx.subjectAssignment.deleteMany({
        where: { OR: [{ facultyId: id }, { hodId: id }] },
      });

      // 6. Finally delete the user
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('DeleteUser error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/auth/users/:id
 * Update a faculty/HOD user's role (promote to HOD or demote back to FACULTY).
 * Protected: ADMIN only.
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { isHod } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'ADMIN') return res.status(403).json({ error: 'Cannot modify admin accounts' });
    if (user.role === 'STUDENT') return res.status(400).json({ error: 'Cannot change student role via this endpoint' });

    const newRole = isHod ? 'HOD' : 'FACULTY';
    const updated = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: { id: true, name: true, email: true, role: true, department: true, employeeId: true, rollNumber: true, createdAt: true },
    });

    res.json({ user: updated });
  } catch (err) {
    console.error('UpdateUser error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { register, login, refreshToken, logout, getMe, getUsers, deleteUser, updateUser, changePassword };