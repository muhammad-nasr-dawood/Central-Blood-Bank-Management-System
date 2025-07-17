const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const hospitalRequestController = require('../controllers/hospitalRequestController');

const router = express.Router();

// Hospital makes a blood request
router.post('/request', authenticateToken, authorizeRoles('hospital'), (req, res, next) => hospitalRequestController.createRequest(req, res, next));
// Admin triggers batch fulfillment of requests
router.post('/batch-fulfill', authenticateToken, authorizeRoles('admin'), (req, res, next) => hospitalRequestController.fulfillBatchRequests(req, res, next));
// Admin gets all requests
router.get('/all', authenticateToken, authorizeRoles('admin'), (req, res, next) => hospitalRequestController.getAllRequests(req, res, next));
// Hospital gets their own requests
router.get('/my', authenticateToken, authorizeRoles('hospital'), (req, res, next) => hospitalRequestController.getRequestsByHospital(req, res, next));

module.exports = router; 