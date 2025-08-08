// routes/webhook.js
const express = require('express');
const Stripe = require('stripe');
const { db } = require('../firebase'); // Firestore connection
const router = express.Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
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

  const data = event.data.object;

  try {
    switch (event.type) {
      /**
       * ✅ User completed checkout (could be trial or instant subscription)
       */
      case 'checkout.session.completed': {
        console.log('✅ Checkout session completed:', data.id);
        const userId = data.metadata?.userId;
        if (!userId) {
          console.error('⚠️ No userId in session metadata.');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(data.subscription);
        const trialEnd = subscription.trial_end ? subscription.trial_end * 1000 : null;
        const trialActive = trialEnd && Date.now() < trialEnd;

        await db.collection('users').doc(userId).set({
          free_trial_active: trialActive,
          subscription_active: !trialActive,
          status: trialActive ? 'trial' : 'subscribed',
          trial_start_date: trialActive ? new Date() : null,
          subscription_start_date: !trialActive ? new Date() : null,
          responses_remaining: 200, // 🎯 Start with quota
          stripe_subscription_id: subscription.id
        }, { merge: true });

        break;
      }

      /**
       * ✅ Payment success — monthly renewal or trial-to-paid conversion
       */
      case 'invoice.payment_succeeded': {
        console.log('✅ Invoice payment succeeded:', data.id);

        const subscription = await stripe.subscriptions.retrieve(data.subscription);
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await db.collection('users').doc(userId).set({
          free_trial_active: false,
          subscription_active: true,
          status: 'subscribed',
          subscription_start_date: new Date(),
          responses_remaining: 200 // 🎯 Reset monthly quota
        }, { merge: true });

        break;
      }

      /**
       * ❌ Payment failed — mark failed but don’t erase trial if still valid
       */
      case 'invoice.payment_failed': {
        console.log('❌ Invoice payment failed:', data.id);

        const subscription = await stripe.subscriptions.retrieve(data.subscription);
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await db.collection('users').doc(userId).set({
          subscription_active: false,
          status: 'payment_failed'
        }, { merge: true });

        break;
      }

      /**
       * 🛑 Subscription cancelled
       */
      case 'customer.subscription.deleted': {
        console.log('🛑 Subscription canceled:', data.id);

        const subscription = await stripe.subscriptions.retrieve(data.id);
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await db.collection('users').doc(userId).set({
          free_trial_active: false,
          subscription_active: false,
          status: 'cancelled'
        }, { merge: true });

        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).send('Received');
  } catch (err) {
    console.error('💥 Error handling webhook:', err);
    res.status(500).send('Webhook handler failed');
  }
});

module.exports = router;
