const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// ✅ Load environment variables from .env
dotenv.config();

const app = express();

// ✅ Allow CORS so Flutter app, web frontend, or mobile can call your backend
app.use(cors());

// ✅ Parse JSON bodies (for API routes)
app.use(express.json());

// ✅ Import and mount your Stripe payment routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

// ✅ Health check / root route
app.get('/', (req, res) => {
  res.send('✅ Stripe backend is running!');
});

// ✅ Start server on specified port (default 3000 if not in .env)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
