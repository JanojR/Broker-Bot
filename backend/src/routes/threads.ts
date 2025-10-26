import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Send message
router.post('/:id/messages', async (req, res) => {
  try {
    const message = await prisma.message.create({
      data: {
        threadId: req.params.id,
        ...req.body,
      },
    });
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
