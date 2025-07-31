const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

// ✅ Add CORS so web frontend can call
app.use(cors());

// ✅ Import your routes
const paymentRoutes = require('./routes/payments');

// ✅ Mount under /api/payments
app.use('/api/payments', paymentRoutes);

// ✅ Root route just to test server
app.get('/', (req, res) => {
  res.send('Stripe backend is running!');
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
