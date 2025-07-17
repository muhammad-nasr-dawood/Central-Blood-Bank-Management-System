const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const donationController = require('../controllers/donationController');

const router = express.Router();

// Donor makes a donation
router.post('/donate', authenticateToken, authorizeRoles('donor'), (req, res, next) => donationController.createDonation(req, res, next));
// Donor gets their own donations
router.get('/my', authenticateToken, authorizeRoles('donor'), (req, res, next) => donationController.getMyDonations(req, res, next));

module.exports = router; 