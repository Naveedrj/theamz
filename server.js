// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { paymentsRouter } = require('./routes/payments');
const webhookRouter = require('./routes/webhook');
const subscriptionStatusRouter = require('./routes/subscription-status');

const app = express();

// Enable CORS
app.use(cors());

// ✅ Stripe webhook BEFORE JSON parsing
app.use('/api/payments/webhook', webhookRouter);

// ✅ Now enable JSON parsing for other routes
app.use(express.json());

// Payments routes
app.use('/api/payments', paymentsRouter);

// Subscription status endpoint
app.use('/api/payments/subscription-status', subscriptionStatusRouter);

// Health check
app.get('/', (req, res) => {
  res.send('✅ Stripe backend is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
