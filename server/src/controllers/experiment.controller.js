const prisma = require('../utils/prisma');
const { uploadFile, uploadPdf } = require('../services/cloudinary.service');

async function getExperiments(req, res) {
  try {
    const where = req.user.role === 'FACULTY'
      ? { createdById: req.user.id }
      : {};

    const experiments = await prisma.experiment.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(experiments);
  } catch (err) {
    console.error('GetExperiments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getExperimentById(req, res) {
  try {
    const experiment = await prisma.experiment.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        contents: { orderBy: { order: 'asc' } },
      },
    });

    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    res.json(experiment);
  } catch (err) {
    console.error('GetExperimentById error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createExperiment(req, res) {
  try {
    const { title, description, arucoId, department, contents } = req.body;

    if (!title || !description || arucoId === undefined) {
      return res.status(400).json({ error: 'Title, description, and arucoId are required' });
    }

    const existing = await prisma.experiment.findUnique({
      where: { arucoId: parseInt(arucoId) },
    });
    if (existing) {
      return res.status(409).json({ error: `ArUco ID ${arucoId} is already assigned to another experiment` });
    }

    const experiment = await prisma.experiment.create({
      data: {
        title,
        description,
        arucoId: parseInt(arucoId),
        department: department || null,
        createdById: req.user.id,
        contents: contents
          ? {
              create: contents.map((c, i) => ({
                type: c.type,
                content: c.content,
                order: c.order ?? i + 1,
                label: c.label,
              })),
            }
          : undefined,
      },
      include: {
        contents: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(experiment);
  } catch (err) {
    console.error('CreateExperiment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateExperiment(req, res) {
  try {
    // BUG FIX 1: Added 'department' to destructuring — it was missing before,
    // so department changes were silently ignored on every save.
    const { title, description, arucoId, department } = req.body;

    const experiment = await prisma.experiment.findUnique({
      where: { id: req.params.id },
    });
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    if (experiment.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this experiment' });
    }

    if (arucoId !== undefined && parseInt(arucoId) !== experiment.arucoId) {
      const conflict = await prisma.experiment.findUnique({
        where: { arucoId: parseInt(arucoId) },
      });
      if (conflict) {
        return res.status(409).json({ error: `ArUco ID ${arucoId} is already in use` });
      }
    }

    const updated = await prisma.experiment.update({
      where: { id: req.params.id },
      data: {
        title: title ?? experiment.title,
        description: description ?? experiment.description,
        arucoId: arucoId !== undefined ? parseInt(arucoId) : experiment.arucoId,
        // BUG FIX 1 (cont): Now actually persists department on update
        department: department !== undefined ? department : experiment.department,
      },
      include: {
        contents: { orderBy: { order: 'asc' } },
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('UpdateExperiment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteExperiment(req, res) {
  try {
    const experiment = await prisma.experiment.findUnique({
      where: { id: req.params.id },
    });
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }
    if (experiment.createdById !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.experiment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Experiment deleted' });
  } catch (err) {
    console.error('DeleteExperiment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function addContent(req, res) {
  try {
    const { type, content, order, label } = req.body;

    const experiment = await prisma.experiment.findUnique({
      where: { id: req.params.id },
    });
    if (!experiment) {
      return res.status(404).json({ error: 'Experiment not found' });
    }

    const contentItem = await prisma.experimentContent.create({
      data: {
        experimentId: req.params.id,
        type,
        content,
        order: order ?? 999,
        label,
      },
    });

    res.status(201).json(contentItem);
  } catch (err) {
    console.error('AddContent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateContent(req, res) {
  try {
    const { type, content, order, label } = req.body;

    const item = await prisma.experimentContent.findFirst({
      where: { id: req.params.contentId, experimentId: req.params.id },
    });
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const updated = await prisma.experimentContent.update({
      where: { id: req.params.contentId },
      data: {
        type: type ?? item.type,
        content: content ?? item.content,
        order: order ?? item.order,
        label: label !== undefined ? label : item.label,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('UpdateContent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteContent(req, res) {
  try {
    const item = await prisma.experimentContent.findFirst({
      where: { id: req.params.contentId, experimentId: req.params.id },
    });
    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    await prisma.experimentContent.delete({ where: { id: req.params.contentId } });
    res.json({ message: 'Content deleted' });
  } catch (err) {
    console.error('DeleteContent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function uploadContentFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let url;
    if (req.file.mimetype === 'application/pdf') {
      url = await uploadPdf(req.file.buffer, req.file.originalname);
    } else {
      url = await uploadFile(req.file.buffer);
    }

    res.json({ url });
  } catch (err) {
    console.error('UploadContentFile error:', err);
    res.status(500).json({ error: 'File upload failed' });
  }
}

module.exports = {
  getExperiments,
  getExperimentById,
  createExperiment,
  updateExperiment,
  deleteExperiment,
  addContent,
  updateContent,
  deleteContent,
  uploadContentFile,
};