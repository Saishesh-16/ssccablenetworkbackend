/**
 * Payment Routes
 * Defines all payment history API endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getPaymentHistory,
  getAllPayments,
  clearPaymentHistory,
  markPaymentAsPaid
} = require('../controllers/paymentController');

// Get payment history for a customer
router.get('/customer/:customerId', getPaymentHistory);

// Get all payments
router.get('/', getAllPayments);

// Clear payment history for a customer
router.delete('/customer/:customerId', clearPaymentHistory);

// Mark a specific payment as paid
router.put('/:paymentId/mark-paid', markPaymentAsPaid);

module.exports = router;

