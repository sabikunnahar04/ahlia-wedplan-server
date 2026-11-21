
import { Router } from 'express';
import { getDb } from '../../config/db.js';
import { sendSuccess } from '../../utils/sendSuccess.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const data = req.body;

    const result = await getDb().collection('services').insertOne(data);

    sendSuccess(res, result, 'Service added successfully', 201);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const services = await getDb().collection('services').find({}).toArray();

    sendSuccess(res, services, 'Services fetched successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
