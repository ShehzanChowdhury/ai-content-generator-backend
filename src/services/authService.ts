import { User, IUser } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Register a new user
 * @param name - User's full name
 * @param email - User's email address
 * @param password - User's password (will be hashed)
 * @returns User object, access token, and refresh token
 */
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in database
  user.refreshToken = refreshToken;
  await user.save();

  // Return user without password
  const userObject = user.toObject();
  delete (userObject as any).password;
  delete (userObject as any).refreshToken;

  return { user: userObject as IUser, accessToken, refreshToken };
};

/**
 * Login user
 * @param email - User's email address
 * @param password - User's password
 * @returns User object, access token, and refresh token
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> => {
  // Find user by email and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Compare passwords
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token in database
  user.refreshToken = refreshToken;
  await user.save();

  // Return user without password
  const userObject = user.toObject();
  delete (userObject as any).password;
  delete (userObject as any).refreshToken;

  return { user: userObject as IUser, accessToken, refreshToken };
};

/**
 * Refresh access token using refresh token
 * @param refreshToken - Refresh token string
 * @returns New access token and refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Find user and include refreshToken field
  const user = await User.findById(decoded.userId).select('+refreshToken');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if stored refresh token matches
  if (!user.refreshToken || user.refreshToken !== refreshToken) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Update refresh token in database
  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout user by invalidating refresh token
 * @param userId - User ID
 */
export const logoutUser = async (userId: string): Promise<void> => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Remove refresh token
  user.refreshToken = undefined;
  await user.save();
};

