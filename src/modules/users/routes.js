import { Router } from 'express';
import { getDb } from '../../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const users = await getDb().collection('user').find({}).toArray();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

export default router;
