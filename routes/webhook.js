const express = require('express');
const Stripe = require('stripe');
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { subscriptionsDb } = require('./payments');

router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
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
