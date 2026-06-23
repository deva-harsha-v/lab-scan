const prisma = require('../utils/prisma');
/**
 * Transition sessions that have passed their time thresholds.
 * ACTIVE → GRACE: when endsAt has passed
 * GRACE → CLOSED: when endsAt + gracePeriodMinutes has passed
 * Returns array of transitioned sessions.
 */
async function transitionExpiredSessions() {
  const now = new Date();
  const transitioned = [];

  // Find ACTIVE sessions where endsAt has passed → move to GRACE
  const activeExpired = await prisma.session.findMany({
    where: {
      status: 'ACTIVE',
      endsAt: { lte: now },
    },
  });

  for (const session of activeExpired) {
    const updated = await prisma.session.update({
      where: { id: session.id },
      data: { status: 'GRACE' },
    });
    transitioned.push({ ...updated, previousStatus: 'ACTIVE' });
  }

  // Find GRACE sessions where endsAt + gracePeriodMinutes has passed → move to CLOSED
  const graceExpired = await prisma.session.findMany({
    where: { status: 'GRACE' },
  });

  for (const session of graceExpired) {
    const graceEnd = new Date(session.endsAt);
    graceEnd.setMinutes(graceEnd.getMinutes() + session.gracePeriodMinutes);

    if (graceEnd <= now) {
      const updated = await prisma.session.update({
        where: { id: session.id },
        data: { status: 'CLOSED' },
      });
      transitioned.push({ ...updated, previousStatus: 'GRACE' });
    }
  }

  return transitioned;
}

module.exports = { transitionExpiredSessions };
