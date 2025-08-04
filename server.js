const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Allow CORS
app.use(cors());

// Use raw body *only* for webhook
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./routes/payments'));

// Parse JSON body for all other routes
app.use(express.json());

// Mount other payment routes
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/', (req, res) => {
  res.send('✅ Stripe backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
