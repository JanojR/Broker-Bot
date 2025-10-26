import { Worker } from 'bullmq';
import { initiateOutreach } from '../services/messaging';
import { PrismaClient } from '@prisma/client';
import { isWithinQuietHours } from '../services/compliance';

const prisma = new PrismaClient();

/**
 * Messaging worker handles scheduled outreach
 */
export function createMessagingWorker(connection: any) {
  const worker = new Worker(
    'messaging',
    async (job) => {
      const { providerId, projectId } = job.data;
      
      try {
        // Check quiet hours
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (project?.quietHours && isWithinQuietHours(project.quietHours)) {
          console.log('Skipping message due to quiet hours');
          return { skipped: true };
        }
        
        console.log(`Sending outreach to provider ${providerId}`);
        const result = await initiateOutreach(providerId, projectId);
        return result;
      } catch (error) {
        console.error('Messaging job failed:', error);
        throw error;
      }
    },
    { connection }
  );
  
  worker.on('completed', (job) => {
    console.log(`Messaging job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Messaging job ${job.id} failed:`, err);
  });
  
  return worker;
}
