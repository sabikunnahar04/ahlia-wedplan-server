
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';
import { verifyToken } from '../../middleware/verifyToken.js';

const router = Router();

// Create booking
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can create bookings',
      });
    }

    const { serviceId, eventDate, eventLocation, message } = req.body;

    if (!serviceId || !ObjectId.isValid(serviceId) || !eventDate || !eventLocation) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required information',
      });
    }

    const db = getDb();

    const service = await db.collection('services').findOne({
      _id: new ObjectId(serviceId),
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    if (service.vendorId === req.user.sub) {
      return res.status(400).json({
        success: false,
        message: 'You cannot book your own service',
      });
    }

    const existingBooking = await db.collection('bookings').findOne({
      customerId: req.user.sub,
      serviceId,
      eventDate,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking for this date',
      });
    }

    const booking = {
      serviceId,
      serviceName: service.name,
      vendorId: service.vendorId,
      customerId: req.user.sub,
      customerEmail: req.user.email,
      eventDate,
      eventLocation,
      message: message || '',
      status: 'pending',
      createdAt: new Date(),
    };

    const result = await db.collection('bookings').insertOne(booking);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// Get all bookings
router.get('/', async (req, res, next) => {
  try {
    const bookings = await getDb().collection('bookings').find({}).toArray();
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});
router.get('/my-bookings', verifyToken, async (req, res, next) => {
  try {
    const bookings = await getDb()
      .collection('bookings')
      .find({ customerId: req.user.sub })
      .toArray();

    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

export default router;
