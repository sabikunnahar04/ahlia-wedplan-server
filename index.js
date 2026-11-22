
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './src/config/db.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import servicesRoutes from './src/modules/services/routes.js';
import bookingsRoutes from './src/modules/bookings/routes.js';
import usersRoutes from './src/modules/users/routes.js';
import dashboardRoutes from './src/modules/dashboard/routes.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
