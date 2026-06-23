const express = require('express');
const router = express.Router();
const {
  createSection, getSections, getSectionById,
  createSubject, getSubjects, updateSubject,
  createAssignment, getAssignments, deleteAssignment,
  bulkCreateAssignments,
  getFacultyList, getHodStats,
  enrollStudent, getStudents, bulkEnrollStudents,
} = require('../controllers/hod.controller');
const { authenticate, requireRole } = require('../middleware/auth');

const hodOnly = [authenticate, requireRole('HOD')];
const hodOrAdmin = [authenticate, requireRole('HOD', 'ADMIN')];

// Stats
router.get('/stats', ...hodOnly, getHodStats);

// Sections
router.get('/sections', ...hodOrAdmin, getSections);
router.post('/sections', ...hodOnly, createSection);
router.get('/sections/:id', ...hodOrAdmin, getSectionById);

// Subjects
router.get('/subjects', authenticate, getSubjects);
router.post('/subjects', ...hodOnly, createSubject);
router.put('/subjects/:id', ...hodOnly, updateSubject);

// Assignments
router.get('/assignments', ...hodOnly, getAssignments);
router.post('/assignments/bulk', ...hodOnly, bulkCreateAssignments);
router.post('/assignments', ...hodOnly, createAssignment);
router.delete('/assignments/:id', ...hodOnly, deleteAssignment);

// Faculty list (for dropdown)
router.get('/faculty', ...hodOrAdmin, getFacultyList);

// Students
router.get('/students', ...hodOrAdmin, getStudents);
router.post('/students/enroll', ...hodOnly, enrollStudent);
router.post('/students/bulk-enroll', ...hodOnly, bulkEnrollStudents);

module.exports = router;