const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// Donor Registration
router.post('/register', (req, res, next) => userController.registerDonor(req, res, next));

// Login (Donor, Hospital, Admin)
router.post('/login', (req, res, next) => userController.login(req, res, next));

// Email verification
router.get('/verify-email', (req, res, next) => userController.verifyEmail(req, res, next));

// Forgot Password
router.post('/forgot-password', (req, res, next) => userController.forgotPassword(req, res, next));
// Reset Password
router.post('/reset-password', (req, res, next) => userController.resetPassword(req, res, next));

module.exports = router; 