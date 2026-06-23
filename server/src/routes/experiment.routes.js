const express = require('express');
const router = express.Router();
const {
  getExperiments,
  getExperimentById,
  createExperiment,
  updateExperiment,
  deleteExperiment,
  addContent,
  updateContent,
  deleteContent,
  uploadContentFile,
} = require('../controllers/experiment.controller');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public — students can fetch experiment data
router.get('/', authenticate, getExperiments);
router.get('/:id', authenticate, getExperimentById);

// Faculty only
router.post('/', authenticate, requireRole('FACULTY', 'HOD'), createExperiment);
router.put('/:id', authenticate, requireRole('FACULTY', 'HOD'), updateExperiment);
router.delete('/:id', authenticate, requireRole('FACULTY', 'HOD'), deleteExperiment);

// BUG FIX 2: Upload route MUST come before /:id/contents/:contentId
// Previously it was declared after, so Express matched "upload" as a
// :contentId parameter and routed file uploads to the wrong handler.
router.post(
  '/:id/contents/upload',
  authenticate,
  requireRole('FACULTY', 'HOD'),
  upload.single('file'),
  uploadContentFile
);

// Experiment content management
router.post('/:id/contents', authenticate, requireRole('FACULTY', 'HOD'), addContent);
router.put('/:id/contents/:contentId', authenticate, requireRole('FACULTY', 'HOD'), updateContent);
router.delete('/:id/contents/:contentId', authenticate, requireRole('FACULTY', 'HOD'), deleteContent);

module.exports = router;