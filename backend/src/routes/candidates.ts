import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get candidates for a project
router.get('/projects/:projectId/candidates', async (req, res) => {
  try {
    const candidates = await prisma.provider.findMany({
      where: { projectId: req.params.projectId },
      include: { contacts: true, quotes: true },
      orderBy: { score: 'desc' },
    });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

export default router;
