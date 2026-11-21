
import { Router } from 'express';
import { getDb } from '../../config/db.js';
import { sendSuccess } from '../../utils/sendSuccess.js';
import { verifyToken, verifyVendor } from '../../middleware/verifyToken.js';
import { ObjectId } from 'mongodb';

const router = Router();

router.post('/', verifyToken, verifyVendor, async (req, res, next) => {
  try {
    const { vendorId: _vendorId, ...data } = req.body;
    data.vendorId = req.user.sub;
    data.status = "pending";

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


router.put('/admin/:id/status', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update service status',
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await getDb().collection('services').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status } }
    );

    sendSuccess(res, result, 'Service status updated successfully');
  } catch (err) {
    next(err);
  }
});

router.get('/admin', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access this route',
      });
    }

    const services = await getDb()
      .collection('services')
      .find({})
      .toArray();

    sendSuccess(res, services, 'Services fetched successfully');
  } catch (err) {
    next(err);
  }
});

router.get('/my-services', verifyToken, verifyVendor, async (req, res, next) => {
  try {
    const services = await getDb().collection('services').find({ vendorId: req.user.sub }).toArray();

    sendSuccess(res, services, 'Services fetched successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
