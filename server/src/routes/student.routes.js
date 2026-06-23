const express = require('express');
const router = express.Router();
const { getMyDashboard, submitExperiment, getLabDetail } = require('../controllers/student.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const studentOnly = [authenticate, requireRole('STUDENT')];

router.get('/dashboard', ...studentOnly, getMyDashboard);
router.get('/labs/:assignmentId', ...studentOnly, getLabDetail);
router.post('/submit', ...studentOnly, submitExperiment);

module.exports = router;
