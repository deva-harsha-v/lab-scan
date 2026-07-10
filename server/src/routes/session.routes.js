const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getSessionById,
  getSessionByCode,
  updateSession,
  activateSession,
  closeSession,
  deleteSession,
} = require('../controllers/session.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Faculty routes
router.post('/', authenticate, requireRole('FACULTY', 'HOD'), createSession);
router.get('/', authenticate, requireRole('FACULTY', 'HOD'), getSessions);
router.get('/my', authenticate, requireRole('FACULTY', 'HOD'), getSessions);
router.put('/:id', authenticate, requireRole('FACULTY', 'HOD'), updateSession);
router.post('/:id/activate', authenticate, requireRole('FACULTY', 'HOD'), activateSession);
router.post('/:id/close', authenticate, requireRole('FACULTY', 'HOD'), closeSession);
router.delete('/:id', authenticate, requireRole('FACULTY', 'HOD'), deleteSession);

// Public — student joins by code (no auth)
router.get('/code/:code', getSessionByCode);

// Protected by auth (faculty or student)
router.get('/:id', authenticate, getSessionById);

module.exports = router;