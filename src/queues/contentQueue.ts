import { Queue } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { ContentType } from '../models/Content.js';

/**
 * Job data interface for content generation jobs
 */
export interface ContentGenerationJobData {
  contentId: string;
  userId: string;
  contentType: ContentType;
  topic: string;
}

/**
 * Content generation queue
 * Handles queuing of AI content generation jobs with 1-minute delay
 */
export const contentQueue = new Queue<ContentGenerationJobData>('content-generation', {
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 second delay, then exponential backoff
    },
  },
});

/**
 * Add a content generation job to the queue with 1-minute delay
 * @param jobData - Job data containing content information
 * @returns Job ID
 */
export const addContentGenerationJob = async (
  jobData: ContentGenerationJobData
): Promise<string> => {
  const job = await contentQueue.add(
    'generate-content',
    jobData,
    {
      delay: 60000, // 1 minute delay (60000 milliseconds)
      jobId: `content-${jobData.contentId}`, // Unique job ID based on content ID
    }
  );

  return job.id!;
};

/**
 * Get job status from queue
 * @param jobId - Job ID to check
 * @returns Job status information
 */
export const getJobStatus = async (jobId: string) => {
  const job = await contentQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;
  const returnValue = job.returnvalue;
  const failedReason = job.failedReason;

  return {
    id: job.id,
    state,
    progress,
    returnValue,
    failedReason,
    data: job.data,
  };
};

