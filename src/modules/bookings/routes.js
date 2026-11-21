import { Router } from 'express';
import { getDb } from '../../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const bookings = await getDb().collection('bookings').find({}).toArray();
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

export default router;
