
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { ObjectId } from 'mongodb';
import connectDB from '../config/db.js';

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

export async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, JWKS);

    req.user = payload;

    if (!payload.sub || !payload.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user information',
      });
    }

    const user = await db.collection('user').findOne({
      _id: new ObjectId(payload.sub),
    });

    if (user?.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been blocked',
      });
    }

    next();
  } catch (err) {
    res.status(401).json({
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
