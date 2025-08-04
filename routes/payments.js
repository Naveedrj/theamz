const express = require('express');
const Stripe = require('stripe');
const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// replace with your real product & price IDs from Stripe
const PRICE_ID = 'price_1RsQvXRp2tKidYl8BfIbke76';

// Simple in-memory DB to test (replace with Firestore in production)
const subscriptionsDb = {};

/**
 * Create checkout session for subscription with trial
 */
router.post('/create-subscription-session', async (req, res) => {
  try {
    const { userId } = req.body; // pass userId from Flutter

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: PRICE_ID,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 15,
        metadata: { userId }, // save userId to identify later
      },
      success_url: `https://theamz.com/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://theamz.com/payment-cancel`,
    });

    subscriptionsDb[session.id] = { status: 'pending', userId };
    console.log('✅ Created subscription checkout session:', session.id);

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('❌ Failed to create subscription session:', err);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * Webhook to update subscription status
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  if (event.type === 'checkout.session.completed') {
    console.log('✅ Subscription checkout completed:', session.id);
    const userId = session.metadata.userId;
    // Save in Firestore: userId → trial_start_date, subscriptionId etc.
  }

  if (event.type === 'invoice.payment_succeeded') {
    console.log('✅ Payment succeeded for subscription');
    // Update Firestore: set subscription_active=true
  }

  if (event.type === 'invoice.payment_failed') {
    console.log('❌ Payment failed after trial');
    // Update Firestore: subscription_active=false, etc.
  }

  res.status(200).send('Received');
});

module.exports = router;
