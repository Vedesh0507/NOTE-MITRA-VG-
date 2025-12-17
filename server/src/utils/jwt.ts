import jwt, { SignOptions } from 'jsonwebtoken';
import { IUser } from '../models';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate access token (short-lived)
 */
export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_SECRET || 'default-secret-key';
  
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  } as SignOptions);
};

/**
 * Generate refresh token (long-lived)
 */
export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: (user._id as any).toString(),
    email: user.email,
    role: user.role
  };

  const secret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  } as SignOptions);
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET || '') as TokenPayload;
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || '') as TokenPayload;
};

/**
 * Decode token without verification (useful for expired tokens)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (user: IUser) => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user)
  };
};
