const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { paymentsRouter } = require('./routes/payments');
const webhookRouter = require('./routes/webhook');

const app = express();

// CORS
app.use(cors());

// ✅ Webhook uses raw body (must be placed before express.json)
app.use('/api/payments/webhook', webhookRouter);

// ✅ All other routes use normal JSON
app.use(express.json());
app.use('/api/payments', paymentsRouter);

// Health check
app.get('/', (req, res) => {
  res.send('✅ Stripe backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
