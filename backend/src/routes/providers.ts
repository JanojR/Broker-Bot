import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { initiateOutreach } from '../services/messaging';

const router = Router();
const prisma = new PrismaClient();

// Init outreach
router.post('/:id/outreach/init', async (req, res) => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const result = await initiateOutreach(provider.id, provider.projectId);
    
    // Update project status
    await prisma.project.update({
      where: { id: provider.projectId },
      data: { status: 'outreach' },
    });
    
    res.json({ message: 'Outreach initiated', ...result });
  } catch (error: any) {
    console.error('Outreach error:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate outreach' });
  }
});

export default router;
