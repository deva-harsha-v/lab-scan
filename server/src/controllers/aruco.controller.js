const prisma = require('../utils/prisma');

/**
 * GET /api/aruco/lookup/:arucoId
 * Returns the experiment linked to the given ArUco marker ID.
 */
async function lookupByArucoId(req, res) {
  try {
    const arucoId = parseInt(req.params.arucoId);

    if (isNaN(arucoId)) {
      return res.status(400).json({ error: 'Invalid ArUco ID' });
    }

    const experiment = await prisma.experiment.findUnique({
      where: { arucoId },
      include: {
        contents: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!experiment) {
      return res.status(404).json({
        error: `No experiment found for ArUco marker ID: ${arucoId}`,
      });
    }

    res.json(experiment);
  } catch (err) {
    console.error('LookupByArucoId error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { lookupByArucoId };
