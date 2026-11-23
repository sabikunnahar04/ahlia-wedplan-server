
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ObjectId } from 'mongodb';
import connectDB from '../config/db.js';

const CLIENT_URL = process.env.CLIENT_URL;

if (!CLIENT_URL) {
  throw new Error('CLIENT_URL is missing');
}

const JWKS = createRemoteJWKSet(
  new URL('/api/auth/jwks', CLIENT_URL)
);

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token missing',
      });
    }

    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, JWKS);

    const userId = payload.sub;

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID in token',
      });
    }

    const db = await connectDB();

    const user = await db.collection('user').findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked',
      });
    }

    req.user = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

export function verifyVendor(req, res, next) {
  if (req.user.role !== 'vendor') {
    return res.status(403).json({
      success: false,
      message: 'Only vendors can access this route',
    });
  }

  next();
}
