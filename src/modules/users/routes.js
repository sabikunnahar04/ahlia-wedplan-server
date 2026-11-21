
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';
import { verifyToken } from '../../middleware/verifyToken.js';

const router = Router();


router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access users',
      });
    }

    const users = await getDb().collection('user').find({}).toArray();

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});


router.put('/:id/status', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update users',
      });
    }

    const { id } = req.params;
    const { isBlocked } = req.body;

    const result = await getDb().collection('user').updateOne(
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
