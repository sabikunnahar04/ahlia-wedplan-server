
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


router.get('/vendor-bookings', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can access booking requests',
      });
    }

    const bookings = await getDb()
      .collection('bookings')
      .find({ vendorId: req.user.sub })
      .toArray();

    res.json({
      success: true,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
});


 
router.put('/:id/cancel', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can cancel bookings',
      });
    }

    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const result = await getDb().collection('bookings').updateOne(
      {
        _id: new ObjectId(id),
        customerId: req.user.sub,
        status: 'pending',
      },
      {
        $set: { status: 'cancelled' },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending booking not found',
      });
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can update booking status',
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status',
      });
    }

    const result = await getDb().collection('bookings').updateOne(
      {
        _id: new ObjectId(id),
        vendorId: req.user.sub,
        status: 'pending',
      },
      {
        $set: { status },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pending booking not found',
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
    });
  } catch (err) {
    next(err);
  }
});


export default router;
