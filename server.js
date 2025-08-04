// app.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const paymentRoutes = require('./routes/payments');

// ✅ Allow CORS for frontend / Flutter
app.use(cors());

// ✅ Parse raw body for webhook only
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// ✅ JSON parser for other routes
app.use(express.json());

// ✅ Mount payment routes
app.use('/api/payments', paymentRoutes);

// ✅ Health check
app.get('/', (req, res) => res.send('✅ Stripe backend is running!'));

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
