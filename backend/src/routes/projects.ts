import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { processSourcing } from '../services/sourcing';

const router = Router();
const prisma = new PrismaClient();

// Create project
router.post('/', async (req, res) => {
  try {
    // Create or get demo user
    const user = await prisma.user.upsert({
      where: { email: 'demo@contractr.ai' },
      update: {},
      create: {
        email: 'demo@contractr.ai',
        name: 'Demo User',
      },
    });

    const project = await prisma.project.create({
      data: {
        ...req.body,
        userId: user.id,
        mustHaves: req.body.mustHaves || [],
        niceToHaves: req.body.niceToHaves || [],
        seedContractors: req.body.seedContractors || [],
        seedContacts: req.body.seedContacts || [],
        channelsAllowed: req.body.channelsAllowed || ['email'],
        autopilot: req.body.autopilot !== undefined ? req.body.autopilot : true,
      },
      include: { providers: true },
    });
    res.json(project);
  } catch (error: any) {
    console.error('Project creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create project' });
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
    
    // Process sourcing synchronously for immediate results
    console.log(`Starting sourcing for project ${req.params.id}`);
    const result = await processSourcing(req.params.id);
    console.log(`Sourcing completed for project ${req.params.id}`);
    
    // Update status to awaiting approval
    await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'awaiting_approval' },
    });
    
    // Auto-start outreach to demo contractors
    if (result.autoOutreach) {
      console.log('Starting automated outreach to demo contractors...');
      const { initiateOutreach } = require('../services/messaging');
      const providers = await prisma.provider.findMany({
        where: { 
          projectId: req.params.id,
          notes: 'Demo contractor for negotiation testing',
        },
        include: { contacts: true },
      });
      
      for (const provider of providers) {
        try {
          await initiateOutreach(provider.id, req.params.id);
          console.log(`✅ Sent initial outreach to ${provider.name}`);
        } catch (err: any) {
          console.error(`Failed to outreach ${provider.name}:`, err.message);
        }
      }
    }
    
    res.json({ message: 'Sourcing completed with outreach', status: 'awaiting_approval' });
  } catch (error: any) {
    console.error('Sourcing error:', error);
    await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'draft' },
    });
    res.status(500).json({ error: error.message || 'Failed to start sourcing' });
  }
});

export default router;
