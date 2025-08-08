// payments.js
const express = require('express');
const Stripe = require('stripe');
const { db } = require('../firebase'); // Firestore connection
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create subscription checkout session with 15-day trial
 * DO NOT write Firestore record immediately here.
 * Trial is marked active only via webhook after payment info entered.
 */
router.post('/create-subscription-session', async (req, res) => {
  try {
    const { userId } = req.body;
    const priceId = process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: 'Missing STRIPE_PRICE_ID in .env' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in request body' });
    }

    // Create Checkout session with trial configured on Stripe
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 15,
        metadata: { userId }, // Store userId for webhook use
      },
      success_url: `https://theamz.com/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://theamz.com/payment-cancel`,
      metadata: { userId } // Duplicate on session for webhook
    });

    // IMPORTANT: Do NOT write trial status to Firestore here!
    // Wait for webhook confirmation after user completes checkout.

    console.log('✅ Created subscription session for user:', userId, '| Session:', session.id);
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('❌ Failed to create subscription session:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Check subscription status from Firestore
 * Flutter client polls this to detect trial/subscription activation.
 */
router.get('/check-status', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in query' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ status: 'not_found' });
    }

    res.json(userDoc.data());
  } catch (err) {
    console.error('❌ Failed to fetch subscription status:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = { paymentsRouter: router };
