
import { Router } from 'express';
import connectDB from '../../config/db.js';
import { verifyToken } from '../../middleware/verifyToken.js';

const router = Router();

router.get('/overview', verifyToken, async (req, res, next) => {
  
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can access dashboard',
      });
    }

    const db = await connectDB();

    const totalUsers = await db.collection('user').countDocuments({});
    const totalVendors = await db.collection('user').countDocuments({ role: 'vendor' });
    const totalCustomers = await db.collection('user').countDocuments({ role: 'customer' });
    const totalServices = await db.collection('services').countDocuments({});
    const pendingServices = await db.collection('services').countDocuments({ status: 'pending' });
    const totalTransactions = await db.collection('transactions').countDocuments({});

    res.json({
      success: true,
      data: {
        totalUsers,
        totalVendors,
        totalCustomers,
        totalServices,
        pendingServices,
        totalTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
