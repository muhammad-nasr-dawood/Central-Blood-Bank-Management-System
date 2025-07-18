const mongoose = require('mongoose');

const hospitalRequestSchema = new mongoose.Schema({
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  bloodType: { type: String, required: true },
  quantity: { type: Number, required: true },
  patientStatus: { type: String, enum: ['Immediate', 'Urgent', 'Normal'], required: true },
  requestDate: { type: Date, default: Date.now },
  fulfilled: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('HospitalRequest', hospitalRequestSchema); 