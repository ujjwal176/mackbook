const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());

// Stripe webhook raw handler MUST be before express.json()
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), require('./routes/payment.routes'));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/campaigns', require('./routes/campaign.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
