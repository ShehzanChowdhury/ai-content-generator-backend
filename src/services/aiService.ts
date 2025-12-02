import { GoogleGenAI } from '@google/genai';
import { ContentType } from '../models/Content.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * AI Service for generating content using Google GenAI
 * Handles all AI API interactions
 */
class AIService {
  private client: GoogleGenAI | null = null;

  /**
   * Initialize Google GenAI client
   */
  private initializeClient(): void {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey) {
      throw new AppError('GOOGLE_GENAI_API_KEY is not configured', 500);
    }

    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Generate prompt based on content type
   * @param contentType - Type of content to generate
   * @param topic - User's topic/prompt
   * @returns Formatted prompt for AI
   */
  private generatePrompt(contentType: ContentType, topic: string): string {
    const prompts: Record<ContentType, string> = {
      [ContentType.BLOG_POST_OUTLINE]: `Create a comprehensive blog post outline for the topic: "${topic}". Include main headings, subheadings, and key points for each section.`,
      [ContentType.PRODUCT_DESCRIPTION]: `Write an engaging product description for: "${topic}". Include key features, benefits, and a compelling call-to-action.`,
      [ContentType.SOCIAL_MEDIA_CAPTION]: `Create a catchy social media caption for: "${topic}". Make it engaging, include relevant hashtags, and keep it appropriate for platforms like Instagram, Twitter, and Facebook.`,
      [ContentType.ARTICLE]: `Write a well-structured article about: "${topic}". Include an introduction, main body with multiple paragraphs, and a conclusion.`,
      [ContentType.EMAIL]: `Draft a professional email about: "${topic}". Include a clear subject line suggestion and a well-structured email body.`,
    };

    return prompts[contentType] || `Generate content about: "${topic}"`;
  }

  /**
   * Generate content using Google GenAI
   * @param contentType - Type of content to generate
   * @param topic - User's topic/prompt
   * @returns Generated content string
   */
  async generateContent(contentType: ContentType, topic: string): Promise<string> {
    try {
      this.initializeClient();

      if (!this.client) {
        throw new AppError('AI client not initialized', 500);
      }

      const prompt = this.generatePrompt(contentType, topic);

      // Call Google GenAI API
      // Using the official @google/genai package API
      // Reference: https://ai.google.dev/gemini-api/docs#javascript
      const response = await this.client.models.generateContent({
        model: 'gemini-2.5-flash', // Using the latest recommended model
        contents: prompt,
      });

      // Extract generated text from response
      const generatedText = response.text;

      if (!generatedText) {
        throw new AppError('Failed to generate content from AI - no text returned', 500);
      }

      return generatedText;
    } catch (error) {
      console.error('AI generation error:', error);
      
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `AI content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

