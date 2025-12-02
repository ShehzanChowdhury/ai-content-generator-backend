import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import { getRedisClient } from './config/redis.js';
import { ContentGenerationJobData } from './queues/contentQueue.js';
import { aiService } from './services/aiService.js';
import { updateContentJobStatus } from './services/contentService.js';
import { JobStatus } from './models/Content.js';
import { connectDatabase } from './config/database.js';

/**
 * Worker process for processing AI content generation jobs
 * This worker runs separately from the main Express server
 * and processes jobs from the Redis queue after the 1-minute delay
 */

// Load environment variables
dotenv.config();

// Connect to database
connectDatabase().catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

/**
 * Create worker to process content generation jobs
 */
const worker = new Worker<ContentGenerationJobData>(
  'content-generation',
  async (job) => {
    console.log(`🔄 Processing job ${job.id} for content ${job.data.contentId}`);

    try {
      // Update job status to processing
      // Use job.id (queue job ID) which matches the jobId stored in the content document
      await updateContentJobStatus(job.id!, JobStatus.PROCESSING);

      // Generate content using AI service
      const generatedContent = await aiService.generateContent(
        job.data.contentType,
        job.data.topic
      );

      // Update content in database with generated content
      // Use job.id (queue job ID) which matches the jobId stored in the content document
      const content = await updateContentJobStatus(
        job.id!,
        JobStatus.COMPLETED,
        generatedContent
      );

      if (!content) {
        throw new Error(`Content not found for job ID: ${job.id}`);
      }

      console.log(`✅ Job ${job.id} completed successfully`);

      // Publish job completion event to Redis for WebSocket notification
      const redis = getRedisClient();
      await redis.publish(
        'job-updates',
        JSON.stringify({
          jobId: job.id,
          contentId: content._id.toString(),
          status: JobStatus.COMPLETED,
          generatedContent,
        })
      );

      // Return result
      return {
        contentId: content._id.toString(),
        jobId: job.id,
        generatedContent,
        status: JobStatus.COMPLETED,
      };
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error);

      // Update job status to failed
      // Use job.id (queue job ID) which matches the jobId stored in the content document
      await updateContentJobStatus(job.id!, JobStatus.FAILED);

      // Publish job failure event to Redis for WebSocket notification
      const redis = getRedisClient();
      await redis.publish(
        'job-updates',
        JSON.stringify({
          jobId: job.id,
          contentId: job.data.contentId,
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      );

      // Re-throw error so BullMQ can handle retries
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Maximum 10 jobs
      duration: 60000, // Per 60 seconds (rate limiting)
    },
  }
);

/**
 * Worker event handlers
 */
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} has been completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} has failed:`, err.message);
});

worker.on('error', (err) => {
  console.error('❌ Worker error:', err);
});

/**
 * Graceful shutdown
 */
const shutdown = async () => {
  console.log('🛑 Shutting down worker...');
  await worker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('👷 Worker started and listening for jobs...');

