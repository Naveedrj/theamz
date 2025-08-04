// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ✅ Allow CORS for frontend
app.use(cors());

// ✅ Import payment routes
const paymentRoutes = require('./routes/payments');

// ✅ Use raw body *only* for webhook
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes);

// ✅ Use JSON parser for all other routes
app.use(express.json());

// ✅ Mount other payment routes (create-checkout-session, check-status)
app.use('/api/payments', paymentRoutes);

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('✅ Stripe backend is running!');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
