const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const nodemailer = require('nodemailer');
require('dotenv').config();

class UserService {
  async registerDonor({ name, email, password, city, latitude, longitude, nationalId }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new Error('Email already exists');
    const hashed = await bcrypt.hash(password, 10);
    // Find or create city
    const City = require('../models/City');
    let cityDoc = await City.findOne({ name: city });
    if (!cityDoc) {
      cityDoc = await City.create({ name: city, latitude, longitude });
    }
    const donor = await userRepository.create({
      name,
      email,
      password: hashed,
      city: cityDoc._id,
      nationalId,
      role: 'donor',
      verified: false,
    });
    // Generate verification token
    const token = jwt.sign({ id: donor._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // Send verification email
    await this.sendVerificationEmail(email, token);
    return donor;
  }

  async sendVerificationEmail(email, token) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    // Use verify-email.html for the verification link
    const verifyUrl = `${process.env.BASE_URL}/verify-email.html?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
      html: `<p>Please verify your email by clicking <a href="${verifyUrl}">here</a>.</p>`
    });
  }

  async verifyEmail(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      if (!user) throw new Error('Invalid verification link');
      if (user.verified) return { message: 'Email already verified' };
      await userRepository.updateById(user._id, { verified: true });
      return { message: 'Email verified successfully' };
    } catch (err) {
      throw new Error('Invalid or expired verification link');
    }
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');
    // Only require verification for donors
    if (user.role === 'donor' && !user.verified) {
      // Re-send verification email
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      await this.sendVerificationEmail(user.email, token);
      throw new Error('Please verify your email before logging in. A new verification email has been sent.');
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return { token, role: user.role, name: user.name };
  }

  async addHospital({ name, email, password, city, latitude, longitude }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new Error('Email already exists');
    const hashed = await bcrypt.hash(password, 10);
    // Find or create city
    const City = require('../models/City');
    let cityDoc = await City.findOne({ name: city });
    if (!cityDoc) {
      cityDoc = await City.create({ name: city, latitude, longitude });
    }
    // Save hospital with city reference in User collection
    const hospital = await userRepository.create({
      name,
      email,
      password: hashed,
      city: cityDoc._id,
      role: 'hospital',
      verified: true, // Hospitals are trusted, no need for verification
    });
    return hospital;
  }

  async addBranch({ name, city, latitude, longitude }) {
    // Find or create city
    const City = require('../models/City');
    let cityDoc = await City.findOne({ name: city });
    if (!cityDoc) {
      cityDoc = await City.create({ name: city, latitude, longitude });
    }
    // Save branch with city reference
    const branch = await userRepository.createBranch({
      name,
      city: cityDoc._id
    });
    return branch;
  }
}

module.exports = new UserService(); 