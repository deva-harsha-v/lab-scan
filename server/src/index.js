require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const experimentRoutes = require('./routes/experiment.routes');
const sessionRoutes = require('./routes/session.routes');
const submissionRoutes = require('./routes/submission.routes');
const arucoRoutes = require('./routes/aruco.routes');
const hodRoutes = require('./routes/hod.routes');
const labAssignmentRoutes = require('./routes/labAssignment.routes');
const studentRoutes = require('./routes/student.routes');
// 1. ADDED: Bulk import route import
const bulkImportRoutes = require('./routes/bulkImport.routes'); 

// BUG FIX 3: This import now resolves correctly because sessionCron.js exists
const { startSessionCron } = require('./utils/sessionCron');
const jwt = require('jsonwebtoken');
const prisma = require('./utils/prisma');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in routes/controllers
app.set('io', io);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/aruco', arucoRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/lab-assignments', labAssignmentRoutes);
app.use('/api/student', studentRoutes);
// 2. ADDED: Bulk import route registration
app.use('/api/admin/bulk-import', bulkImportRoutes); 

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io authentication — every connection must present a valid access
// token. This stops anonymous clients from joining session/student rooms
// and silently receiving other people's real-time submission/marks events.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id} (user ${socket.user?.id})`);

  socket.on('join_session_room', async (sessionId) => {
    try {
      const session = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!session) return;
      const role = socket.user.role;
      const isOwner = role === 'FACULTY' && session.facultyId === socket.user.id;
      const isOversight = role === 'HOD' || role === 'ADMIN';
      if (!isOwner && !isOversight) return; // silently refuse — no error detail leaked

      socket.join(`session:${sessionId}`);
      console.log(`Socket ${socket.id} joined room: session:${sessionId}`);
    } catch (err) {
      console.error('join_session_room error:', err);
    }
  });

  socket.on('leave_session_room', (sessionId) => {
    socket.leave(`session:${sessionId}`);
    console.log(`Socket ${socket.id} left room: session:${sessionId}`);
  });

  // Student personal room — used to push real-time marks updates.
  // A socket may only join its own student room.
  socket.on('join_student_room', (studentId) => {
    if (socket.user.id !== studentId) return;
    socket.join(`student:${studentId}`);
    console.log(`Socket ${socket.id} joined student room: student:${studentId}`);
  });

  socket.on('leave_student_room', (studentId) => {
    socket.leave(`student:${studentId}`);
    console.log(`Socket ${socket.id} left student room: student:${studentId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start cron jobs
startSessionCron(io);

// Global error handler — catches any unhandled errors from route handlers.
// Without this, Express sends raw stack traces to the client in production.
app.use((err, req, res, next) => {
  console.error('[UnhandledError]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 LabScan server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});