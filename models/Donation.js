const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  bloodType: { type: String, required: true },
  virusTestResult: { type: String, enum: ['negative', 'positive'], required: true },
  city: { type: String, required: true },
  expirationDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema); 