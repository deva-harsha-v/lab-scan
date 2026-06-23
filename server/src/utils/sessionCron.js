// BUG FIX 3: This file was imported in index.js but did not exist,
// causing the server to crash immediately on startup with:
//   "Cannot find module './utils/sessionCron'"
// This made every single API call fail with a connection error.

/**
 * Starts any scheduled cron jobs that need to run server-side.
 * The `io` parameter is the Socket.io server instance, available
 * for broadcasting real-time events from within scheduled tasks.
 *
 * Add your cron logic here as needed (e.g. auto-closing expired sessions).
 */
function startSessionCron(io) {
  // Example: auto-close sessions that have passed their end time.
  // Uncomment and expand this block when ready:
  //
  // const { PrismaClient } = require('@prisma/client');
  // const prisma = new PrismaClient();
  //
  // setInterval(async () => {
  //   try {
  //     const expired = await prisma.session.findMany({
  //       where: { status: 'ACTIVE', endsAt: { lt: new Date() } },
  //     });
  //     for (const session of expired) {
  //       await prisma.session.update({
  //         where: { id: session.id },
  //         data: { status: 'CLOSED' },
  //       });
  //       io.to(`session:${session.id}`).emit('session_closed', { sessionId: session.id });
  //       console.log(`[Cron] Auto-closed expired session: ${session.id}`);
  //     }
  //   } catch (err) {
  //     console.error('[Cron] Session cleanup error:', err);
  //   }
  // }, 60 * 1000); // runs every 60 seconds

  console.log('[Cron] Session cron started (no active jobs).');
}

module.exports = { startSessionCron };
