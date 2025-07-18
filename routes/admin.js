const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const userController = require('../controllers/userController');
const donationController = require('../controllers/donationController');
const userService = require('../services/userService');
const donationService = require('../services/donationService');
const Branch = require('../models/Branch');

const City = require('../models/City');

const router = express.Router();

// Add Hospital (Admin only)
router.post('/add-hospital', authenticateToken, authorizeRoles('admin'), (req, res, next) => userController.addHospital(req, res, next));
// Add Donation (Admin only)
router.post('/add-donation', authenticateToken, authorizeRoles('admin'), (req, res, next) => userController.adminAddDonation(req, res, next));
// Update Donation Virus Status (Admin only)
router.patch('/donation/:donationId/virus-status', authenticateToken, authorizeRoles('admin'), (req, res, next) => donationController.adminUpdateVirusStatus(req, res, next));
// Get All Donations (Admin only)
router.get('/donations', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const donations = await donationService.getAllDonations();
    res.json({ donations });
  } catch (err) {
    next(err);
  }
});
// Add Branch (Admin only)
router.post('/add-branch', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const branch = await userService.addBranch(req.body);
    res.status(201).json({ message: 'Branch added successfully', branch });
  } catch (err) {
    next(err);
  }
});
// Get All Branches (Admin only)
router.get('/branches', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const branches = await Branch.find().populate('city');
    res.json({ branches });
  } catch (err) {
    next(err);
  }
});
// Get All Hospitals (Admin only)
router.get('/hospitals', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const User = require('../models/User');
    const hospitals = await User.find({ role: 'hospital' }).populate('city');
    res.json({ hospitals });
  } catch (err) {
    next(err);
  }
});
// Get all unique cities linked to branches
router.get('/branch-cities', authenticateToken, authorizeRoles('admin'), async (req, res, next) => {
  try {
    const Branch = require('../models/Branch');
    const branches = await Branch.find().populate('city');
    // Get unique cities
    const cityMap = {};
    branches.forEach(b => {
      if (b.city && b.city._id) cityMap[b.city._id] = b.city;
    });
    const cities = Object.values(cityMap);
    res.json({ cities });
  } catch (err) {
    next(err);
  }
});
// Get all cities (for dropdowns)
router.get('/cities', authenticateToken, authorizeRoles('admin', 'hospital'), async (req, res, next) => {
  try {
    const City = require('../models/City');
    const cities = await City.find({}, 'name _id');
    res.json({ cities });
  } catch (err) {
    next(err);
  }
});

module.exports = router; 