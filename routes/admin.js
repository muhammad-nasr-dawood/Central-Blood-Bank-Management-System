const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const userController = require('../controllers/userController');

const router = express.Router();

// Add Hospital (Admin only)
router.post('/add-hospital', authenticateToken, authorizeRoles('admin'), (req, res, next) => userController.addHospital(req, res, next));

module.exports = router; 