const express = require('express');
const router = express.Router();
const {
  createSubmission,
  getSubmissionsBySession,
  getSubmissionById,
  reviewSubmission,
} = require('../controllers/submission.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Student creates submission (kiosk flow — identified by session code + roll
// number, no login). Every roll number is verified against real student
// records and the file's actual bytes are checked, not just its header.
router.post('/', upload.single('observationPhoto'), upload.verifyFileType, createSubmission);

// Faculty reviews
router.get('/session/:sessionId', authenticate, requireRole('FACULTY', 'HOD'), getSubmissionsBySession);
router.get('/:id', authenticate, getSubmissionById);
router.patch('/:id/review', authenticate, requireRole('FACULTY', 'HOD'), reviewSubmission);

module.exports = router;