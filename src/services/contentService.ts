import { Content, IContent, ContentType, JobStatus } from '../models/Content.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

/**
 * Generate prompt based on content type and topic
 * @param contentType - Type of content to generate
 * @param topic - Topic/subject of the content
 * @returns Generated prompt for AI
 */
const generatePrompt = (contentType: ContentType, topic: string): string => {
  const prompts: Record<ContentType, string> = {
    [ContentType.BLOG_POST_OUTLINE]: `Create a comprehensive blog post outline for the topic: "${topic}". Include main headings, subheadings, and key points for each section.`,
    [ContentType.PRODUCT_DESCRIPTION]: `Write an engaging product description for: "${topic}". Include key features, benefits, and a compelling call-to-action.`,
    [ContentType.SOCIAL_MEDIA_CAPTION]: `Create a catchy social media caption for: "${topic}". Make it engaging, include relevant hashtags, and keep it appropriate for platforms like Instagram, Twitter, and Facebook.`,
    [ContentType.ARTICLE]: `Write a well-structured article about: "${topic}". Include an introduction, main body with multiple paragraphs, and a conclusion.`,
    [ContentType.EMAIL]: `Draft a professional email about: "${topic}". Include a clear subject line suggestion and a well-structured email body.`,
  };

  return prompts[contentType] || `Generate content about: "${topic}"`;
};

/**
 * Create a new content entry
 * @param userId - ID of the user creating the content
 * @param topic - Topic/subject of the content
 * @param contentType - Type of content to generate
 * @returns Created content document
 */
export const createContent = async (
  userId: string,
  topic: string,
  contentType: ContentType
): Promise<IContent> => {
  // Generate prompt automatically
  const prompt = generatePrompt(contentType, topic);

  const content = new Content({
    userId: new mongoose.Types.ObjectId(userId),
    topic,
    contentType,
    prompt,
    jobStatus: JobStatus.QUEUED,
  });

  await content.save();
  return content;
};

/**
 * Get all content for a user
 * @param userId - ID of the user
 * @param page - Page number for pagination
 * @param limit - Number of items per page
 * @returns Paginated content list
 */
export const getUserContent = async (
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ content: IContent[]; total: number; page: number; totalPages: number }> => {
  const skip = (page - 1) * limit;

  const [content, total] = await Promise.all([
    Content.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Content.countDocuments({ userId }),
  ]);

  return {
    content: content as unknown as IContent[],
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get a single content by ID
 * @param contentId - ID of the content
 * @param userId - ID of the user (for authorization)
 * @returns Content document
 */
export const getContentById = async (
  contentId: string,
  userId: string
): Promise<IContent> => {
  const content = await Content.findOne({
    _id: contentId,
    userId,
  });

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  return content;
};

/**
 * Update content (only allows updating topic and content, NOT generatedContent)
 * @param contentId - ID of the content to update
 * @param userId - ID of the user (for authorization)
 * @param updates - Fields to update (only topic and content allowed)
 * @returns Updated content document
 */
export const updateContent = async (
  contentId: string,
  userId: string,
  updates: Partial<Pick<IContent, 'topic' | 'content'>>
): Promise<IContent> => {
  const content = await Content.findOneAndUpdate(
    { _id: contentId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  return content;
};

/**
 * Delete content
 * @param contentId - ID of the content to delete
 * @param userId - ID of the user (for authorization)
 */
export const deleteContent = async (
  contentId: string,
  userId: string
): Promise<void> => {
  const result = await Content.deleteOne({
    _id: contentId,
    userId,
  });

  if (result.deletedCount === 0) {
    throw new AppError('Content not found', 404);
  }
};

/**
 * Update content job status and generated content
 * When AI generates content, it sets generatedContent and initializes content to the same value
 * @param jobId - Job ID from queue
 * @param jobStatus - New job status
 * @param generatedContent - Generated content from AI (optional)
 */
export const updateContentJobStatus = async (
  jobId: string,
  jobStatus: JobStatus,
  generatedContent?: string
): Promise<IContent | null> => {
  // First, get the current content to check if content field is already set
  const existingContent = await Content.findOne({ jobId });
  
  const updateData: any = { jobStatus };
  if (generatedContent !== undefined) {
    updateData.generatedContent = generatedContent;
    // Initialize content with generatedContent only if content is null
    // This ensures content is available for editing when AI generation completes
    // but preserves any user edits that might have happened
    if (!existingContent?.content) {
      updateData.content = generatedContent;
    }
  }

  const content = await Content.findOneAndUpdate(
    { jobId },
    { $set: updateData },
    { new: true }
  );

  return content;
};

/**
 * Get content by job ID
 * @param jobId - Job ID from queue
 * @returns Content document
 */
export const getContentByJobId = async (jobId: string): Promise<IContent | null> => {
  return Content.findOne({ jobId });
};

/**
 * Rollback content to generatedContent
 * Reverts the user-editable content back to the AI-generated content
 * @param contentId - ID of the content to rollback
 * @param userId - ID of the user (for authorization)
 * @returns Updated content document
 */
export const rollbackContent = async (
  contentId: string,
  userId: string
): Promise<IContent> => {
  const content = await Content.findOne({
    _id: contentId,
    userId,
  });

  if (!content) {
    throw new AppError('Content not found', 404);
  }

  if (!content.generatedContent) {
    throw new AppError('No generated content available to rollback to', 400);
  }

  // Set content to generatedContent
  content.content = content.generatedContent;
  await content.save();

  return content;
};

