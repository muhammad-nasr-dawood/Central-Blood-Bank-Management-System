const mongoose = require('mongoose');

const bloodStockSchema = new mongoose.Schema({
  bloodType: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  quantity: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('BloodStock', bloodStockSchema); 