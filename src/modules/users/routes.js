
import { Router } from 'express';
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

export default router;
