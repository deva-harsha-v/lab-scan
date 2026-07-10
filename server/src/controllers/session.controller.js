const prisma = require('../utils/prisma');
const { generateSessionCode } = require('../utils/codeGen');

async function createSession(req, res) {
  try {
    const { experimentId, startsAt, endsAt, gracePeriodMinutes, allowResubmit } = req.body;

    if (!startsAt || !endsAt) {
      return res.status(400).json({ error: 'startsAt and endsAt are required' });
    }

    // Validate experiment only if provided
    if (experimentId) {
      const experiment = await prisma.experiment.findUnique({ where: { id: experimentId } });
      if (!experiment) {
        return res.status(404).json({ error: 'Experiment not found' });
      }
    }

    const code = await generateSessionCode();

    const session = await prisma.session.create({
      data: {
        code,
        ...(experimentId ? { experimentId } : {}),
        facultyId: req.user.id,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        gracePeriodMinutes: gracePeriodMinutes ?? 10,
        allowResubmit: allowResubmit ?? false,
        status: 'DRAFT',
      },
      include: {
        experiment: { select: { id: true, title: true, arucoId: true } },
        faculty: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
    });

    res.status(201).json(session);
  } catch (err) {
    console.error('CreateSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSessions(req, res) {
  try {
    const sessions = await prisma.session.findMany({
      where: { facultyId: req.user.id },
      include: {
        experiment: { select: { id: true, title: true, arucoId: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(sessions);
  } catch (err) {
    console.error('GetSessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSessionById(req, res) {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        experiment: {
          include: { contents: { orderBy: { order: 'asc' } } },
        },
        faculty: { select: { id: true, name: true, email: true } },
        _count: { select: { submissions: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (err) {
    console.error('GetSessionById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getSessionByCode(req, res) {
  try {
    const session = await prisma.session.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: {
        experiment: {
          include: { contents: { orderBy: { order: 'asc' } } },
        },
        faculty: { select: { id: true, name: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found. Check the code and try again.' });
    }

    if (session.status === 'CLOSED') {
      return res.status(410).json({ error: 'This session has ended.' });
    }

    res.json(session);
  } catch (err) {
    console.error('GetSessionByCode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateSession(req, res) {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (session.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only edit sessions in DRAFT status' });
    }

    const { startsAt, endsAt, gracePeriodMinutes, allowResubmit } = req.body;
    const updated = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        startsAt: startsAt ? new Date(startsAt) : undefined,
        endsAt: endsAt ? new Date(endsAt) : undefined,
        gracePeriodMinutes: gracePeriodMinutes ?? undefined,
        allowResubmit: allowResubmit ?? undefined,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('UpdateSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function activateSession(req, res) {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (session.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Session is not in DRAFT status' });
    }

    const updated = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
      include: {
        experiment: { select: { id: true, title: true } },
        _count: { select: { submissions: true } },
      },
    });

    // Emit status change via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`session:${req.params.id}`).emit('session_status_changed', {
        sessionId: req.params.id,
        status: 'ACTIVE',
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('ActivateSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function closeSession(req, res) {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.session.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED' },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session:${req.params.id}`).emit('session_status_changed', {
        sessionId: req.params.id,
        status: 'CLOSED',
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('CloseSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteSession(req, res) {
  try {
    const session = await prisma.session.findUnique({ where: { id: req.params.id } });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.facultyId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (session.status === 'ACTIVE' || session.status === 'GRACE') {
      return res.status(400).json({ error: 'Cannot delete an active or grace-period session' });
    }

    await prisma.session.delete({ where: { id: req.params.id } });
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error('DeleteSession error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  getSessionByCode,
  updateSession,
  activateSession,
  closeSession,
  deleteSession,
};
