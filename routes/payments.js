const express = require('express');
const Stripe = require('stripe');
const bodyParser = require('body-parser');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ In-memory DB (replace with real DB in prod)
const paymentsDb = {};

// ✅ Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const amount = req.body.amount || 1000;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Test Product' },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: `https://theamz.com/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://theamz.com/payment-cancel`,
    });

    // Save pending status
    paymentsDb[session.id] = { status: 'pending' };

    console.log('✅ Created checkout session:', session.id);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('❌ Failed to create session:', err);
    res.status(500).send('Internal Server Error');
  }
});

// ✅ Check payment status
router.get('/check-status', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !paymentsDb[sessionId]) {
    return res.status(404).json({ status: 'not_found' });
  }
  return res.json({ status: paymentsDb[sessionId].status });
});

// ✅ Stripe webhook
router.post('/webhook',
  bodyParser.raw({ type: 'application/json' }), // raw parser required for Stripe
  (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const session = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed':
        console.log('✅ Payment successful for session:', session.id);
        if (paymentsDb[session.id]) {
          paymentsDb[session.id].status = 'paid';
        }
        break;

      case 'checkout.session.expired':
        console.log('❌ Payment expired / cancelled for session:', session.id);
        if (paymentsDb[session.id]) {
          paymentsDb[session.id].status = 'cancelled';
        }
        break;

      case 'checkout.session.async_payment_succeeded':
        console.log('✅ Async payment succeeded for session:', session.id);
        if (paymentsDb[session.id]) {
          paymentsDb[session.id].status = 'paid';
        }
        break;

      case 'checkout.session.async_payment_failed':
        console.log('❌ Async payment failed for session:', session.id);
        if (paymentsDb[session.id]) {
          paymentsDb[session.id].status = 'failed';
        }
        break;

      default:
        console.log(`ℹ️ Received unknown event: ${event.type}`);
    }

    res.status(200).send('Received');
  }
);

module.exports = router;
