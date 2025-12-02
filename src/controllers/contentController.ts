import { Request, Response } from 'express';
import {
  createContent,
  getUserContent,
  getContentById,
  updateContent,
  deleteContent,
  getContentByJobId,
  rollbackContent,
} from '../services/contentService.js';
import { addContentGenerationJob, getJobStatus } from '../queues/contentQueue.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ContentType } from '../models/Content.js';
import { z } from 'zod';

/**
 * Validation schemas using Zod
 */
const createContentSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic cannot exceed 500 characters'),
  contentType: z.nativeEnum(ContentType, {
    errorMap: () => ({ message: 'Invalid content type' }),
  }),
});

const updateContentSchema = z.object({
  topic: z.string().min(1).max(500).optional(),
  content: z.string().optional(),
});

/**
 * Create new content and queue AI generation job
 * POST /api/v1/content
 */
export const createContentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Validate request body (only topic and contentType)
    const validatedData = createContentSchema.parse(req.body);

    // Create content entry in database (prompt is auto-generated)
    const content = await createContent(
      req.user._id.toString(),
      validatedData.topic,
      validatedData.contentType
    );

    // Add job to queue with 1-minute delay
    const jobId = await addContentGenerationJob({
      contentId: content._id.toString(),
      userId: req.user._id.toString(),
      contentType: validatedData.contentType,
      topic: validatedData.topic,
    });

    // Update content with job ID (status remains QUEUED)
    content.jobId = jobId;
    await content.save();

    res.status(202).json({
      success: true,
      message: 'Content generation job queued successfully',
      data: {
        content: {
          id: content._id,
          topic: content.topic,
          contentType: content.contentType,
          jobId: content.jobId,
          jobStatus: content.jobStatus,
          createdAt: content.createdAt,
        },
        jobId,
        expectedDelay: '1 minute',
      },
    });
  }
);

/**
 * Get all content for authenticated user
 * GET /api/v1/content
 */
export const getContent = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await getUserContent(req.user._id.toString(), page, limit);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * Get single content by ID
 * GET /api/v1/content/:id
 */
export const getContentByIdHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
    return;
  }

  const content = await getContentById(req.params.id, req.user._id.toString());

  res.status(200).json({
    success: true,
    data: {
      content: {
        id: content._id,
        topic: content.topic,
        contentType: content.contentType,
        prompt: content.prompt,
        generatedContent: content.generatedContent,
        content: content.content,
        jobId: content.jobId,
        jobStatus: content.jobStatus,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      },
    },
  });
});

/**
 * Update content
 * PUT /api/v1/content/:id
 */
export const updateContentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Validate request body
    const validatedData = updateContentSchema.parse(req.body);

    const content = await updateContent(req.params.id, req.user._id.toString(), validatedData);

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: {
        content: {
          id: content._id,
          topic: content.topic,
          contentType: content.contentType,
          generatedContent: content.generatedContent,
          content: content.content,
          jobStatus: content.jobStatus,
          updatedAt: content.updatedAt,
        },
      },
    });
  }
);

/**
 * Delete content
 * DELETE /api/v1/content/:id
 */
export const deleteContentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    await deleteContent(req.params.id, req.user._id.toString());

    // REST best practice: DELETE should return 204 No Content
    res.status(204).send();
  }
);

/**
 * Get job status for content generation
 * GET /api/v1/content/job/:jobId/status
 */
export const getJobStatusHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const { jobId } = req.params;

    // Get job status from queue
    const jobStatus = await getJobStatus(jobId);

    if (!jobStatus) {
      res.status(404).json({
        success: false,
        message: 'Job not found',
      });
      return;
    }

    // Get content from database
    const content = await getContentByJobId(jobId);

    if (!content || content.userId.toString() !== req.user._id.toString()) {
      res.status(404).json({
        success: false,
        message: 'Content not found or access denied',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        jobId,
        jobStatus: {
          state: jobStatus.state,
          progress: jobStatus.progress,
          failedReason: jobStatus.failedReason,
        },
        content: {
          id: content._id,
          jobStatus: content.jobStatus,
          generatedContent: content.generatedContent,
          content: content.content,
        },
      },
    });
  }
);

/**
 * Rollback content to generatedContent
 * POST /api/v1/content/:id/rollback
 */
export const rollbackContentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const content = await rollbackContent(req.params.id, req.user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Content rolled back successfully',
      data: {
        content: {
          id: content._id,
          topic: content.topic,
          contentType: content.contentType,
          generatedContent: content.generatedContent,
          content: content.content,
          jobStatus: content.jobStatus,
          updatedAt: content.updatedAt,
        },
      },
    });
  }
);

