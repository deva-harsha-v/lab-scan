// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: server/src/routes/bulkImport.routes.js
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { authenticate, requireRole } = require('../middleware/auth');
const { bulkImportStudents, downloadTemplate } = require('../controllers/bulkImport.controller');

// Memory storage — we parse the buffer directly, no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max — plenty for 10k rows
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// GET  /api/admin/bulk-import/template  — download the CSV template
router.get('/template', authenticate, requireRole('ADMIN'), downloadTemplate);

// POST /api/admin/bulk-import/students  — upload CSV and import
router.post(
  '/students',
  authenticate,
  requireRole('ADMIN'),
  upload.single('file'),
  bulkImportStudents
);

module.exports = router;
