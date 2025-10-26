import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Inbound email
router.post('/email', async (req, res) => {
  try {
    const { from, subject, text, html } = req.body;
    console.log('Email received from:', from);
    
    // Store in database (TODO: Route to thread)
    
    res.status(200).send();
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
});

// Inbound SMS
router.post('/sms', async (req, res) => {
  try {
    const { From, To, Body } = req.body;
    console.log('SMS received:', { From, Body });
    
    // Check for STOP request
    const { isStopRequest } = require('../services/compliance');
    if (isStopRequest(Body)) {
      await prisma.thread.updateMany({
        where: { 
          channel: 'sms',
          // TODO: Match by phone number
        },
        data: { unsubscribe: true },
      });
      
      // Send confirmation
      return res.status(200).type('text/plain').send('You have been unsubscribed. Reply HELP for help.');
    }
    
    // Store in database (TODO: Route to thread)
    
    res.status(200).type('text/plain').send('Thank you for your message.');
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).json({ error: 'Failed to process SMS' });
  }
});

export default router;
