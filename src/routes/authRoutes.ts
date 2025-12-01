import { Router } from 'express';
import { register, login, getMe, refresh, logout } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * Authentication routes
 * Handles user registration, login, token refresh, logout, and profile retrieval
 */
const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

export default router;

