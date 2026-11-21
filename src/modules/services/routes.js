import { Router } from 'express';
import { getDb } from '../../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const services = await getDb().collection('services').find({}).toArray();
    res.json({ success: true, data: services });
  } catch (err) {
    next(err);
  }
});

export default router;
