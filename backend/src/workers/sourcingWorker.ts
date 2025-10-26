import { Worker } from 'bullmq';
import { processSourcing } from '../services/sourcing';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sourcing worker processes jobs from queue
 */
export function createSourcingWorker(connection: any) {
  const worker = new Worker(
    'sourcing',
    async (job) => {
      const { projectId } = job.data;
      
      try {
        console.log(`Processing sourcing for project ${projectId}`);
        await processSourcing(projectId);
        return { success: true };
      } catch (error) {
        console.error('Sourcing job failed:', error);
        throw error;
      }
    },
    { connection }
  );
  
  worker.on('completed', (job) => {
    console.log(`Sourcing job ${job.id} completed`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Sourcing job ${job.id} failed:`, err);
  });
  
  return worker;
}
