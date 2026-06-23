const express = require('express');
const router = express.Router();
const {
  getMyAssignments,
  getAssignmentDetail,
  upsertExperimentSlot,
  deleteExperimentSlot,
  getLabRecords,
  reviewLabRecord,
} = require('../controllers/labAssignment.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// HOD users who assigned themselves as faculty must also be able to access these routes
const facultyOnly = [authenticate, requireRole('FACULTY', 'HOD')];

router.get('/my', ...facultyOnly, getMyAssignments);
router.get('/:id', ...facultyOnly, getAssignmentDetail);
router.post('/:assignmentId/slots', ...facultyOnly, upsertExperimentSlot);
router.delete('/:assignmentId/slots/:slotId', ...facultyOnly, deleteExperimentSlot);
router.get('/:assignmentId/records', ...facultyOnly, getLabRecords);
router.put('/:assignmentId/records/:recordId', ...facultyOnly, reviewLabRecord);

module.exports = router;
