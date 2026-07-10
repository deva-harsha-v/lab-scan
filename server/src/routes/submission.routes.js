const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  createSubmission,
  getSubmissionsBySession,
  getSubmissionById,
  reviewSubmission,
} = require('../controllers/submission.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Rate limiter for submission creation. This endpoint has no login (kiosk
// flow — identified by session code + roll number), so without a limiter
// it's uncapped: a flaky-wifi retry loop or a scripted abuser could hammer
// Cloudinary/the DB with unlimited 20MB uploads.
//
// NOTE: this limits by IP. Many students on the same campus Wi-Fi/NAT can
// share a public IP, so the cap is set generously (well above what a real
// classroom submitting around the same time would need) rather than tight —
// this is meant to stop a runaway loop or scripted abuse, not to throttle
// normal concurrent use.
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submission attempts from this network. Please wait a moment and try again.' },
});

// Student creates submission (kiosk flow — identified by session code + roll
// number, no login). Every roll number is verified against real student
// records and the file's actual bytes are checked, not just its header.
router.post('/', submissionLimiter, upload.single('observationPhoto'), upload.verifyFileType, createSubmission);

// Faculty reviews
router.get('/session/:sessionId', authenticate, requireRole('FACULTY', 'HOD'), getSubmissionsBySession);
router.get('/:id', authenticate, getSubmissionById);
router.patch('/:id/review', authenticate, requireRole('FACULTY', 'HOD'), reviewSubmission);

module.exports = router;
