// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { paymentsRouter } = require('./routes/payments');
const webhookRouter = require('./routes/webhook');
const subscriptionStatusRouter = require('./routes/subscription-status');
const decrementResponseRouter = require('./routes/decrement-response'); // add this

const app = express();

app.use(cors());

// Stripe webhook BEFORE JSON parsing
app.use('/api/payments/webhook', webhookRouter);

// Enable JSON parsing for other routes
app.use(express.json());

// Mount your decrement-response route here
app.use('/api/decrement-response', decrementResponseRouter);

app.use('/api/payments', paymentsRouter);

app.use('/api/payments/subscription-status', subscriptionStatusRouter);

app.get('/', (req, res) => {
  res.send('✅ Stripe backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
