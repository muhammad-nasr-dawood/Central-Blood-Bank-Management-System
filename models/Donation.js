const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  bloodType: { type: String, required: true },
  virusTestResult: { type: String, enum: ['negative', 'positive', 'pending'], required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  expirationDate: { type: Date, required: true },
  expired: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema); 