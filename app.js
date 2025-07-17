const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const donationRoutes = require('./routes/donation');
const hospitalRequestRoutes = require('./routes/hospitalRequest');
const bloodStockRoutes = require('./routes/bloodStock');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donation', donationRoutes);
app.use('/api/hospital-request', hospitalRequestRoutes);
app.use('/api/blood-stock', bloodStockRoutes);

// Placeholder for routes
app.get('/', (req, res) => {
  res.send('Central Blood Bank Management System API');
});

module.exports = app; 