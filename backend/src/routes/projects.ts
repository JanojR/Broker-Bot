import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { processSourcing } from '../services/sourcing';

const router = Router();
const prisma = new PrismaClient();

// Create project
router.post('/', async (req, res) => {
  try {
    const project = await prisma.project.create({
      data: req.body,
      include: { providers: true },
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// List projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        providers: {
          include: {
            contacts: true,
            threads: true,
            quotes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        providers: {
          include: {
            contacts: true,
            threads: { include: { messages: true } },
            quotes: true,
          },
        },
        events: { orderBy: { timestamp: 'desc' } },
      },
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Start sourcing
router.post('/:id/sourcing/start', async (req, res) => {
  try {
    await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'sourcing' },
    });
    
    // Process sourcing in background (in production, use a queue)
    processSourcing(req.params.id).catch(console.error);
    
    res.json({ message: 'Sourcing started', status: 'processing' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start sourcing' });
  }
});

export default router;
