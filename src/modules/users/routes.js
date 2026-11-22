
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import connectDB from '../../config/db.js';
import { verifyToken } from '../../middleware/verifyToken.js';

const router = Router();

// Get all users - Admin
router.get('/', verifyToken, async (req, res, next) => {
  const db = await connectDB()
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access users',
      });
    }

    const users = await db.collection('user').find({}).toArray();

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// Update own profile - Customer and Vendor
router.put('/profile', verifyToken, async (req, res, next) => {
   const db = await connectDB()
  try {
    const { name, image, businessName } = req.body;

    if (!['customer', 'vendor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only customers and vendors can update profile',
      });
    }

    const updateData = {
      name,
      image,
    };

    if (req.user.role === 'vendor') {
      updateData.businessName = businessName;
    }

    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(req.user.sub) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    next(err);
  }
});

// Block / Unblock user - Admin
router.put('/:id/status', verifyToken, async (req, res, next) => {
   const db = await connectDB()
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update users',
      });
    }

    const { id } = req.params;
    const { isBlocked } = req.body;

    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(id) },
      { $set: { isBlocked } }
    );

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
