import { Router } from 'express';
import {
  createContentHandler,
  getContent,
  getContentByIdHandler,
  updateContentHandler,
  deleteContentHandler,
  getJobStatusHandler,
  rollbackContentHandler,
} from '../controllers/contentController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Content routes
 * Handles CRUD operations for content and job status polling
 */
const router = Router();

// All content routes require authentication
router.use(authenticate);

// Job status polling route (must be before /:id route to avoid conflicts)
router.get('/job/:jobId/status', getJobStatusHandler);

// Content CRUD routes
router.post('/', createContentHandler);
router.get('/', getContent);
router.get('/:id', getContentByIdHandler);
router.put('/:id', updateContentHandler);
router.post('/:id/rollback', rollbackContentHandler);
router.delete('/:id', deleteContentHandler);

export default router;

