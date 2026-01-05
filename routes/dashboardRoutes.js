/**
 * Dashboard Routes
 * Defines dashboard-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

// Get dashboard statistics
router.get('/', getDashboardStats);

module.exports = router;

