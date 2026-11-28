
import { Router } from 'express';
import connectDB from '../../config/db.js';
import { verifyToken } from '../../middleware/verifyToken.js';
import { stripe } from '../../config/stripe.js';

const router = Router();

router.post('/create-checkout-session', verifyToken, async (req, res, next) => {
  const db = await connectDB();

  try {
   
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        success: false,
        message: 'Only vendors can upgrade to Premium',
      });
    }

    
    const transaction = await db.collection('transactions').insertOne({
      vendorId: req.user.sub,
      plan: 'premium',
      amount: 19.99,
      currency: 'usd',
      status: 'pending',
      createdAt: new Date(),
    });

    try {
    
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'WedPlan Premium Plan',
                description: 'One-time payment for 1 year Premium access',
              },
              unit_amount: 1999,
            },
            quantity: 1,
          },
        ],

        mode: 'payment',

        success_url: `${process.env.CLIENT_URL}/dashboard/vendor/subscription/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url: `${process.env.CLIENT_URL}/dashboard/vendor/subscription/cancel`,

        metadata: {
          vendorId: req.user.sub,
          transactionId: transaction.insertedId.toString(),
          plan: 'premium',
        },
      });

      
      await db.collection('transactions').updateOne(
        { _id: transaction.insertedId },
        {
          $set: {
            stripeSessionId: session.id,
          },
        }
      );

      res.json({
        success: true,
        message: 'Checkout session created successfully',
        data: {
          redirectUrl: session.url,
        },
      });
    } catch (err) {
      // Mark transaction as failed if session creation fails
      await db.collection('transactions').updateOne(
        { _id: transaction.insertedId },
        {
          $set: {
            status: 'failed',
          },
        }
      );

      throw err;
    }
  } catch (err) {
    next(err);
  }
});

export default router;
