// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/payments');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Stripe Node.js backend is running!'));
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
