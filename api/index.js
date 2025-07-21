const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const authRoutes = require('../routes/auth');
const adminRoutes = require('../routes/admin');
const donationRoutes = require('../routes/donation');
const hospitalRequestRoutes = require('../routes/hospitalRequest');
const bloodStockRoutes = require('../routes/bloodStock');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donation', donationRoutes);
app.use('/api/hospital-request', hospitalRequestRoutes);
app.use('/api/blood-stock', bloodStockRoutes);

// Root route
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../frontend', '404.html'));
});

// Error handler
const errorHandler = require('../middleware/errorHandler');
app.use(errorHandler);

// Note: Cron jobs are disabled for Vercel deployment
// They don't support long-running processes

module.exports = app; 