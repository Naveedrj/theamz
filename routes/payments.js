// routes/payments.js
const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Simple in-memory store (replace with DB in prod)
const subscriptionsDb = {};

/**
 * ✅ Create subscription checkout session with 15-day trial
 * POST /api/payments/create-subscription-session
 */
router.post('/create-subscription-session', async (req, res) => {
  try {
    // You can pass userId from frontend & create a Stripe customer if needed
    const { userId } = req.body;

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID in .env' });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 15,
        metadata: { userId }
      },
      success_url: `https://theamz.com/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://theamz.com/payment-cancel`,
    });

    subscriptionsDb[session.id] = { status: 'pending' };
    console.log('✅ Created subscription session:', session.id);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('❌ Failed to create subscription session:', err);
    res.status(500).send(`Internal Server Error: ${err.message}`);
  }
});

/**
 * ✅ Check subscription status
 * GET /api/payments/check-status?sessionId=...
 */
router.get('/check-status', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !subscriptionsDb[sessionId]) {
    return res.status(404).json({ status: 'not_found' });
  }
  res.json({ status: subscriptionsDb[sessionId].status });
});

/**
 * ✅ Stripe webhook to handle subscription events
 * POST /api/payments/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      console.log('✅ Subscription checkout completed:', session.id);
      if (subscriptionsDb[session.id]) subscriptionsDb[session.id].status = 'paid';
      break;

    case 'checkout.session.expired':
      console.log('❌ Checkout session expired:', session.id);
      if (subscriptionsDb[session.id]) subscriptionsDb[session.id].status = 'cancelled';
      break;

    case 'invoice.payment_succeeded':
      console.log('✅ Subscription payment succeeded (invoice):', session.id);
      break;

    case 'invoice.payment_failed':
      console.log('❌ Subscription payment failed (invoice):', session.id);
      break;

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.status(200).send('Received');
});

module.exports = router;
