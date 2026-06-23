const multer = require('multer');
const { fromBuffer } = require('file-type');

// Use memory storage — no disk writes. File available as req.file.buffer
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const fileFilter = (req, file, cb) => {
  // Cheap first-pass check on the client-supplied Content-Type. This is
  // NOT trustworthy on its own (easily spoofed) — real verification happens
  // in verifyFileType below, after the bytes are actually in memory.
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WebP, GIF, PDF`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max
  },
});

// Inspects the actual file bytes (magic numbers) rather than trusting the
// client-supplied Content-Type header, which can be spoofed to slip a
// malicious file past the fileFilter above.
async function verifyFileType(req, res, next) {
  if (!req.file) return next();
  try {
    const detected = await fromBuffer(req.file.buffer);
    if (!detected || !allowedMimeTypes.includes(detected.mime)) {
      return res.status(400).json({
        error: 'File content does not match an allowed type (JPEG, PNG, WebP, GIF, PDF).',
      });
    }
    next();
  } catch (err) {
    res.status(400).json({ error: 'Could not verify file type.' });
  }
}

module.exports = upload;
module.exports.verifyFileType = verifyFileType;
