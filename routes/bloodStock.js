const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const bloodStockController = require('../controllers/bloodStockController');

const router = express.Router();

// Get all blood stock (admin/hospital)
router.get('/all', authenticateToken, authorizeRoles('admin', 'hospital'), (req, res, next) => bloodStockController.getAllStock(req, res, next));

module.exports = router; 