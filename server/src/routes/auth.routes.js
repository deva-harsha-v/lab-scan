const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, refreshToken, logout, getMe, getUsers, deleteUser, updateUser, changePassword } = require('../controllers/auth.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Rate limiter for registration — prevents mass account creation
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again later.' },
});

// Rate limiter for password changes — prevents brute-forcing the current password
const changePasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password change attempts. Please try again later.' },
});

// Rate limiter for login — prevents credential-stuffing / brute force against
// student accounts (many of which share a default bulk-imported password).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

// POST /api/auth/register — rate-limited; must be authenticated as ADMIN to register
// non-STUDENT roles (FACULTY, HOD). STUDENT self-registration is still allowed.
router.post('/register', registerLimiter, async (req, res, next) => {
  const { role } = req.body;
  if (role && role !== 'STUDENT') {
    // Privileged role — require admin authentication
    return authenticate(req, res, () => requireRole('ADMIN')(req, res, () => register(req, res, next)));
  }
  return register(req, res, next);
});

// POST /api/auth/login
router.post('/login', loginLimiter, login);

// POST /api/auth/refresh
router.post('/refresh', refreshToken);

// POST /api/auth/logout  (revokes the refresh token so it can no longer be used)
router.post('/logout', logout);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, getMe);

// POST /api/auth/change-password  (any authenticated user — self-service)
router.post('/change-password', changePasswordLimiter, authenticate, changePassword);

// GET /api/auth/users  (admin only)
router.get('/users', authenticate, requireRole('ADMIN'), getUsers);

// DELETE /api/auth/users/:id  (admin only)
router.delete('/users/:id', authenticate, requireRole('ADMIN'), deleteUser);

// PATCH /api/auth/users/:id  (admin only)
router.patch('/users/:id', authenticate, requireRole('ADMIN'), updateUser);

module.exports = router;