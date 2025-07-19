const userService = require('../services/userService');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

class UserController {
  async registerDonor(req, res, next) {
    try {
      const donor = await userService.registerDonor(req.body);
      res.status(201).json({ message: 'Donor registered successfully', donor });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const result = await userService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async addHospital(req, res, next) {
    try {
      const hospital = await userService.addHospital(req.body);
      res.status(201).json({ message: 'Hospital added successfully', hospital });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      const result = await userService.verifyEmail(token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async adminAddDonation(req, res, next) {
    try {
      const { donorEmail, date, bloodType, virusTestResult, city, expirationDate } = req.body;
      const userRepository = require('../repositories/userRepository');
      const donationService = require('../services/donationService');
      const donor = await userRepository.findByEmail(donorEmail);
      if (!donor || donor.role !== 'donor') {
        return res.status(404).json({ message: 'Donor not found' });
      }
      const donation = await donationService.createDonation({
        donorId: donor._id,
        date,
        bloodType,
        virusTestResult: virusTestResult || 'pending',
        city,
        expirationDate
      });
      res.status(201).json({ message: 'Donation added successfully', donation });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'No user with that email.' });
      // Generate token
      const token = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();
      // Send email
      const resetUrl = `${process.env.BASE_URL}/reset-password.html?token=${token}`;
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
      });
      res.json({ message: 'Password reset email sent.' });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
      if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });
      user.password = await require('bcryptjs').hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      res.json({ message: 'Password has been reset.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController(); 