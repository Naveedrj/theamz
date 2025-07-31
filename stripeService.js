// stripeService.js
require('dotenv').config();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

async function createPaymentIntent(amount, currency = 'usd') {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });
    return paymentIntent.client_secret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

module.exports = { createPaymentIntent };
