import mongoose, { Document, Schema } from 'mongoose';

/**
 * Content type enumeration
 * Defines the types of content that can be generated
 */
export enum ContentType {
  BLOG_POST_OUTLINE = 'blog_post_outline',
  PRODUCT_DESCRIPTION = 'product_description',
  SOCIAL_MEDIA_CAPTION = 'social_media_caption',
  ARTICLE = 'article',
  EMAIL = 'email',
}

/**
 * Job status enumeration
 * Tracks the status of AI content generation jobs
 */
export enum JobStatus {
  QUEUED = 'queued',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Content interface representing the content document structure
 */
export interface IContent extends Document {
  userId: mongoose.Types.ObjectId;
  topic: string;
  contentType: ContentType;
  prompt: string;
  generatedContent: string | null; // AI-generated content (immutable)
  content: string | null; // User-editable content
  jobId: string | null;
  jobStatus: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content schema definition
 * Stores user-generated and AI-generated content
 */
const contentSchema = new Schema<IContent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true, // Index for faster queries
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      maxlength: [500, 'Topic cannot exceed 500 characters'],
    },
    contentType: {
      type: String,
      enum: Object.values(ContentType),
      required: [true, 'Content type is required'],
    },
    prompt: {
      type: String,
      required: [true, 'Prompt is required'],
      trim: true,
    },
    generatedContent: {
      type: String,
      default: null,
    },
    content: {
      type: String,
      default: null,
    },
    jobId: {
      type: String,
      default: null,
      index: true, // Index for faster job status lookups
    },
    jobStatus: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.QUEUED,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for efficient user content queries
contentSchema.index({ userId: 1, createdAt: -1 });

export const Content = mongoose.model<IContent>('Content', contentSchema);

