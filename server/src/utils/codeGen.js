const prisma = require('./prisma');
// Safe charset: no ambiguous chars (0/O, 1/I/L)
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_RETRIES = 5;

/**
 * Generate a random 6-character session code from the safe charset.
 */
function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

/**
 * Generate a unique session code, checking DB for collisions.
 * Retries up to MAX_RETRIES times.
 * @returns {Promise<string>} Unique session code
 */
async function generateSessionCode() {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = randomCode();
    const existing = await prisma.session.findUnique({ where: { code } });
    if (!existing) {
      return code;
    }
    console.warn(`Code collision on attempt ${attempt + 1}: ${code}`);
  }
  throw new Error('Failed to generate unique session code after maximum retries');
}

module.exports = { generateSessionCode };
