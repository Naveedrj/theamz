const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// ✅ Allow CORS so Flutter or web frontend can call
app.use(cors());

// ✅ JSON parser for normal API routes
app.use(express.json());

// ✅ Import your payments routes
const paymentRoutes = require('./routes/payments');

// ✅ Mount under /api/payments
app.use('/api/payments', paymentRoutes);

// ✅ Root route just to test server is running
app.get('/', (req, res) => {
  res.send('Stripe backend is running!');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
