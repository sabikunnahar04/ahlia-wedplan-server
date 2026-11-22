
import { Router } from 'express';
import { getDb } from '../../config/db.js';
import { sendSuccess } from '../../utils/sendSuccess.js';
import { verifyToken, verifyVendor } from '../../middleware/verifyToken.js';
import { ObjectId } from 'mongodb';

const router = Router();

// Add Service
router.post('/', verifyToken, verifyVendor, async (req, res, next) => {
  try {
    const db = await getDb();

    const vendor = await db.collection('user').findOne({
      _id: new ObjectId(req.user.sub),
    });

    const plan = vendor?.plan || 'free';

    const activeServices = await db.collection('services').countDocuments({
      vendorId: req.user.sub,
      isActive: { $ne: false },
    });

    if (plan === 'free' && activeServices >= 3) {
      return res.status(403).json({
        success: false,
        message: 'Free plan allows maximum 3 active services. Please upgrade to Premium.',
      });
    }

    const { vendorId: _vendorId, ...data } = req.body;

    data.vendorId = req.user.sub;
    data.status = 'pending';
    data.isActive = true;

    const result = await db.collection('services').insertOne(data);

    sendSuccess(res, result, 'Service added successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Get All Approved Services
router.get('/', async (req, res, next) => {
  try {
    const services = await getDb().collection('services').find({
      status: 'approved',
      isActive: { $ne: false },
    }).toArray();

    sendSuccess(res, services, 'Services fetched successfully');
  } catch (err) {
    next(err);
  }
});

// Get Vendor's Services
router.get('/my-services', verifyToken, verifyVendor, async (req, res, next) => {
  try {
    const services = await getDb().collection('services').find({
      vendorId: req.user.sub,
    }).toArray();

    sendSuccess(res, services, 'Services fetched successfully');
  } catch (err) {
    next(err);
  }
});

// Update Service
router.put('/:id', verifyToken, verifyVendor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, price, location, image } = req.body;

    const result = await getDb().collection('services').updateOne(
      {
        _id: new ObjectId(id),
        vendorId: req.user.sub,
      },
      {
        $set: {
          name,
          category,
          description,
          price,
          location,
          image,
        },
      }
    );

    sendSuccess(res, result, 'Service updated successfully');
  } catch (err) {
    next(err);
  }
});

// Vendor: Delete Service
router.delete('/:id', verifyToken, verifyVendor, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await getDb().collection('services').deleteOne({
      _id: new ObjectId(id),
      vendorId: req.user.sub,
    });

    sendSuccess(res, result, 'Service deleted successfully');
  } catch (err) {
    next(err);
  }
});

// Update Service Availability
router.patch('/:id/availability', verifyToken, verifyVendor, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const result = await getDb().collection('services').updateOne(
      {
        _id: new ObjectId(id),
        vendorId: req.user.sub,
      },
      {
        $set: { isActive },
      }
    );

    sendSuccess(res, result, 'Availability updated successfully');
  } catch (err) {
    next(err);
  }
});

// Admin: Update Service Status
router.put('/admin/:id/status', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update service status',
      });
    }

    const result = await getDb().collection('services').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: req.body.status } }
    );

    sendSuccess(res, result, 'Service status updated successfully');
  } catch (err) {
    next(err);
  }
});

// Admin: Delete Service
router.delete('/admin/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can delete services',
      });
    }

    const result = await getDb().collection('services').deleteOne({
      _id: new ObjectId(req.params.id),
    });

    sendSuccess(res, result, 'Service deleted successfully');
  } catch (err) {
    next(err);
  }
});

// Admin: Get All Services
router.get('/admin', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access this route',
      });
    }

    const services = await getDb().collection('services').find({}).toArray();

    sendSuccess(res, services, 'Services fetched successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
