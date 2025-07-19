const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: function() { return this.role !== 'admin'; } },
  nationalId: { type: String, required: function() { return this.role === 'donor'; }, unique: false },
  role: { type: String, enum: ['donor', 'hospital', 'admin'], required: true },
  verified: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 