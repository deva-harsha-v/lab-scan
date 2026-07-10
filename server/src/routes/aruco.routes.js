const express = require('express');
const router = express.Router();
const { lookupByArucoId } = require('../controllers/aruco.controller');
// Look up experiment by ArUco marker ID
// Called after client-side detection
// Public route — no auth required, students scan without logging in
router.get('/lookup/:arucoId', lookupByArucoId);

module.exports = router;
