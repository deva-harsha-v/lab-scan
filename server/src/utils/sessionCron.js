const { transitionExpiredSessions } = require('../services/session.service');

const CRON_INTERVAL_MS = 60 * 1000; // check every 60 seconds

/**
 * Starts the recurring job that auto-transitions sessions based on time:
 *   ACTIVE → GRACE   (once endsAt has passed)
 *   GRACE  → CLOSED  (once endsAt + gracePeriodMinutes has passed)
 *
 * Without this running, sessions rely entirely on faculty manually clicking
 * "Close Session" — if that's forgotten, a session stays ACTIVE indefinitely
 * and students can submit long after the lab has ended.
 *
 * The `io` parameter is the Socket.io server instance, used to notify
 * connected clients (e.g. student scan pages, faculty dashboards) the
 * moment a session's status changes, using the same
 * `session_status_changed` event the manual activate/close endpoints emit.
 */
function startSessionCron(io) {
  setInterval(async () => {
    try {
      const transitioned = await transitionExpiredSessions();

      for (const session of transitioned) {
        console.log(
          `[Cron] Session ${session.id} auto-transitioned: ${session.previousStatus} -> ${session.status}`
        );

        if (io) {
          io.to(`session:${session.id}`).emit('session_status_changed', {
            sessionId: session.id,
            status: session.status,
          });
        }
      }
    } catch (err) {
      console.error('[Cron] Session transition error:', err);
    }
  }, CRON_INTERVAL_MS);

  console.log(
    `[Cron] Session cron started — checking for expired sessions every ${CRON_INTERVAL_MS / 1000}s.`
  );
}

module.exports = { startSessionCron };
