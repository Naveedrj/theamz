const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Simple in-memory store (replace with DB in production)
const subscriptionsDb = {};

/**
 * ✅ Create subscription checkout session with 15-day trial
 */
router.post('/create-subscription-session', async (req, res) => {
  try {
    const { userId } = req.body;
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID in .env' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 15,
        metadata: { userId },
      },
      success_url: `https://theamz.com/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://theamz.com/payment-cancel`,
    });

    subscriptionsDb[session.id] = { status: 'pending' };
    console.log('✅ Created subscription session:', session.id);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('❌ Failed to create subscription session:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Check subscription status
 */
router.get('/check-status', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !subscriptionsDb[sessionId]) {
    return res.status(404).json({ status: 'not_found' });
  }
  res.json({ status: subscriptionsDb[sessionId].status });
});

module.exports = { paymentsRouter: router, subscriptionsDb };
