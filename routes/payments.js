// routes/payments.js
const express = require('express');
const router = express.Router();
const { createPaymentIntent } = require('../stripeService');

router.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;
  try {
    const clientSecret = await createPaymentIntent(amount);
    res.json({ clientSecret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
