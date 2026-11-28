
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ObjectId } from 'mongodb';
import { connectDB } from './src/config/db.js';
import { stripe } from './src/config/stripe.js';
import { notFound, errorHandler } from './src/middleware/errorHandler.js';
import servicesRoutes from './src/modules/services/routes.js';
import bookingsRoutes from './src/modules/bookings/routes.js';
import usersRoutes from './src/modules/users/routes.js';
import dashboardRoutes from './src/modules/dashboard/routes.js';
import subscriptionRoutes from './src/modules/subscription/routes.js';

const app = express();

app.use(cors({ origin: true }));


app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);

      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.payment_status === 'paid') {
          const { vendorId, transactionId } = session.metadata;

          if (!ObjectId.isValid(vendorId) || !ObjectId.isValid(transactionId)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid payment information',
            });
          }

          const db = await connectDB();

          const transaction = await db.collection('transactions').findOne({
            _id: new ObjectId(transactionId),
            vendorId,
          });

          if (!transaction) {
            return res.status(404).json({
              success: false,
              message: 'Transaction not found',
            });
          }

          // Prevent processing the same payment twice
          if (transaction.status === 'paid') {
            return res.json({ received: true });
          }

          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          const userResult = await db.collection('user').updateOne(
            {
              _id: new ObjectId(vendorId),
              role: 'vendor',
            },
            {
              $set: {
                subscriptionPlan: 'premium',
                subscriptionExpiresAt: expiresAt,
              },
            }
          );

          if (userResult.matchedCount === 0) {
            return res.status(404).json({
              success: false,
              message: 'Vendor not found',
            });
          }

          await db.collection('transactions').updateOne(
            { _id: new ObjectId(transactionId) },
            {
              $set: {
                status: 'paid',
                stripePaymentIntentId: session.payment_intent,
                paidAt: new Date(),
                expiresAt,
              },
            }
          );
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);

      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
      });
    }
  }
);


app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
  });
});

app.use('/api/services', servicesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

export default app;
