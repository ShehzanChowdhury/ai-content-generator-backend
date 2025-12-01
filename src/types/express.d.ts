import { IUser } from '../models/User.js';

/**
 * Extend Express Request interface to include user information
 * This allows TypeScript to recognize the user property added by auth middleware
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

