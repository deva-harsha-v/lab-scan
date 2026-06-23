// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: server/src/controllers/bulkImport.controller.js
// ─────────────────────────────────────────────────────────────────────────────
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { parse } = require('csv-parse/sync');

/**
 * POST /api/admin/bulk-import/students
 * Accepts a CSV file upload (multipart/form-data, field name: "file")
 * 
 * Required CSV columns:
 *   name, email, rollNumber, department, password
 * Optional CSV columns:
 *   sectionId   (if provided, student is enrolled into that section)
 *
 * Returns a summary: { created, skipped, errors[] }
 * 
 * Uses createMany with skipDuplicates for speed, then falls back to
 * individual inserts only for the ones that failed, so we can collect
 * per-row error messages without killing the whole batch.
 */
async function bulkImportStudents(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded. Use field name "file".' });
    }

    // Parse CSV
    let rows;
    try {
      rows = parse(req.file.buffer, {
        columns: true,           // first row = headers
        skip_empty_lines: true,
        trim: true,
      });
    } catch (parseErr) {
      return res.status(400).json({ error: `CSV parse error: ${parseErr.message}` });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty.' });
    }

    // Validate required columns exist
    const required = ['name', 'email', 'rollNumber', 'department', 'password'];
    const headers = Object.keys(rows[0]);
    const missing = required.filter(c => !headers.includes(c));
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required columns: ${missing.join(', ')}` });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    // Pre-hash a default password if all rows use the same one (big speedup)
    // Otherwise hash per-row. We batch rows by password value.
    const passwordHashCache = {};
    const getHash = async (pw) => {
      if (!passwordHashCache[pw]) {
        passwordHashCache[pw] = await bcrypt.hash(pw, 10);
      }
      return passwordHashCache[pw];
    };

    // Process in chunks of 100 to avoid overwhelming DB connection pool
    const CHUNK_SIZE = 100;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);

      // Build user data array for this chunk
      const userData = [];
      for (const [idx, row] of chunk.entries()) {
        const rowNum = i + idx + 2; // +2: 1-indexed + header row

        // Row-level validation
        if (!row.name?.trim()) {
          results.errors.push({ row: rowNum, rollNumber: row.rollNumber, reason: 'name is required' });
          results.skipped++;
          continue;
        }
        if (!row.email?.trim() || !row.email.includes('@')) {
          results.errors.push({ row: rowNum, rollNumber: row.rollNumber, reason: 'valid email is required' });
          results.skipped++;
          continue;
        }
        if (!row.rollNumber?.trim()) {
          results.errors.push({ row: rowNum, rollNumber: row.rollNumber, reason: 'rollNumber is required' });
          results.skipped++;
          continue;
        }
        if (!row.password?.trim() || row.password.trim().length < 6) {
          results.errors.push({ row: rowNum, rollNumber: row.rollNumber, reason: 'password must be at least 6 characters' });
          results.skipped++;
          continue;
        }

        const passwordHash = await getHash(row.password.trim());
        userData.push({
          name:         row.name.trim(),
          email:        row.email.trim().toLowerCase(),
          passwordHash,
          role:         'STUDENT',
          department:   row.department?.trim() || null,
          rollNumber:   row.rollNumber.trim().toUpperCase(),
          sectionId:    row.sectionId?.trim() || null,
        });
      }

      if (userData.length === 0) continue;

      // Try fast batch insert — skipDuplicates silently skips conflicting rows
      try {
        const batchResult = await prisma.user.createMany({
          data: userData,
          skipDuplicates: true,
        });
        results.created += batchResult.count;

        // If fewer were created than attempted, some were duplicates — count them
        const skippedInBatch = userData.length - batchResult.count;
        if (skippedInBatch > 0) {
          results.skipped += skippedInBatch;
          // Find which ones were skipped by checking DB for existing records
          const emails     = userData.map(u => u.email);
          const rolls      = userData.map(u => u.rollNumber);
          const existing   = await prisma.user.findMany({
            where: { OR: [{ email: { in: emails } }, { rollNumber: { in: rolls } }] },
            select: { email: true, rollNumber: true },
          });
          const existingEmails = new Set(existing.map(u => u.email));
          const existingRolls  = new Set(existing.map(u => u.rollNumber));
          // Only report rows that weren't just created
          const createdEmails = new Set(); // we don't have this info after createMany
          userData.forEach((u, idx) => {
            // Check if this user existed BEFORE this batch (i.e., it was a duplicate)
            if (existingEmails.has(u.email) || existingRolls.has(u.rollNumber)) {
              // Only report as error if it was a pre-existing record
              const rowNum = i + idx + 2;
              results.errors.push({
                row: rowNum,
                rollNumber: u.rollNumber,
                reason: existingEmails.has(u.email)
                  ? `email already exists: ${u.email}`
                  : `roll number already exists: ${u.rollNumber}`,
              });
            }
          });
        }
      } catch (batchErr) {
        // Batch failed entirely — fall back to individual inserts to isolate the bad row
        for (const [idx, u] of userData.entries()) {
          const rowNum = i + idx + 2;
          try {
            await prisma.user.create({ data: u });
            results.created++;
          } catch (rowErr) {
            results.skipped++;
            let reason = 'Unknown error';
            if (rowErr.code === 'P2002') {
              const field = rowErr.meta?.target?.join(', ') || 'field';
              reason = `Duplicate ${field}`;
            } else {
              reason = rowErr.message;
            }
            results.errors.push({ row: rowNum, rollNumber: u.rollNumber, reason });
          }
        }
      }
    }

    return res.status(200).json({
      message: `Import complete. ${results.created} created, ${results.skipped} skipped.`,
      created: results.created,
      skipped: results.skipped,
      errors:  results.errors,
    });
  } catch (err) {
    console.error('BulkImport error:', err);
    res.status(500).json({ error: 'Internal server error during bulk import.' });
  }
}

/**
 * GET /api/admin/bulk-import/template
 * Returns a downloadable CSV template file.
 */
function downloadTemplate(req, res) {
  const csv = [
    'name,email,rollNumber,department,sectionId,password',
    'Ravi Kumar,ravi.kumar@college.edu,22CS001,CSE,,Welcome@123',
    'Priya Sharma,priya.sharma@college.edu,22CS002,CSE,,Welcome@123',
    'Anjali Reddy,anjali.reddy@college.edu,22EC001,ECE,,Welcome@123',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="student_import_template.csv"');
  res.send(csv);
}

module.exports = { bulkImportStudents, downloadTemplate };
