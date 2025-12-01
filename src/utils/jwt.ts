import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models/User.js';

/**
 * JWT token payload interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
}

/**
 * Generate access token for user (short-lived)
 * @param user - User document from database
 * @returns JWT access token string
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  // Access token expires in 15 minutes by default
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

  const options = {
    expiresIn,
  } as SignOptions;

  return jwt.sign(payload, secret, options);
};

/**
 * Generate refresh token for user (long-lived)
 * @param user - User document from database
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
  };

  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET environment variable is not set');
  }

  // Refresh token expires in 7 days by default
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  const options = {
    expiresIn,
  } as SignOptions;

  return jwt.sign(payload, secret, options);
};

/**
 * Generate JWT token for user (backward compatibility)
 * @param user - User document from database
 * @returns JWT token string
 * @deprecated Use generateAccessToken instead
 */
export const generateToken = (user: IUser): string => {
  return generateAccessToken(user);
};

/**
 * Verify and decode access token
 * @param token - JWT access token string
 * @returns Decoded token payload
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify and decode refresh token
 * @param token - JWT refresh token string
 * @returns Decoded token payload
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET or JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Verify and decode JWT token (backward compatibility)
 * @param token - JWT token string
 * @returns Decoded token payload
 * @deprecated Use verifyAccessToken instead
 */
export const verifyToken = (token: string): TokenPayload => {
  return verifyAccessToken(token);
};

