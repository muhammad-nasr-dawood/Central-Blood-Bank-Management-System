const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const cron = require('node-cron');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

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

// Error handler middleware - must be last!
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Scheduled job: Decrement stock for expired donations every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const Donation = require('./models/Donation');
    const bloodStockRepository = require('./repositories/bloodStockRepository');
    const now = new Date();
    // Find all expired, negative-status donations
    const expiredDonations = await Donation.find({ virusTestResult: 'negative', expirationDate: { $lte: now } });
    for (const donation of expiredDonations) {
      // Decrement stock for this bloodType/city if exists
      let stock = await bloodStockRepository.findByBloodTypeAndCity(donation.bloodType, donation.city);
      if (stock && stock.quantity > 0) {
        await bloodStockRepository.updateById(stock._id, { quantity: stock.quantity - 1 });
      }
      // Mark donation as expired
      donation.expired = true;
      await donation.save();
    }
    if (expiredDonations.length > 0) {
      console.log(`[CRON] Decremented stock for ${expiredDonations.length} expired donations at ${now}`);
    }
  } catch (err) {
    console.error('[CRON] Error decrementing expired stock:', err);
  }
});

module.exports = app; 