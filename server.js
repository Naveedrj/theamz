const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { paymentsRouter } = require('./routes/payments');
const webhookRouter = require('./routes/webhook');
const subscriptionStatusRouter = require('./routes/subscription-status');

const app = express();

// CORS
app.use(cors());

// ✅ Register webhook BEFORE express.json()
app.use('/api/payments/webhook', webhookRouter);

// ✅ Now apply body parser
app.use(express.json());

// Payments routes
app.use('/api/payments', paymentsRouter);

// ✅ Subscription status route (matches Flutter call)
app.use('/api/payments/subscription-status', subscriptionStatusRouter);

// Health check
app.get('/', (req, res) => {
  res.send('✅ Stripe backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
