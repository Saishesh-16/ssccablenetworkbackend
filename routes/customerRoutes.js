/**
 * Customer Routes
 * Defines all customer-related API endpoints
 */

const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  addCustomer,
  updatePayment,
  updateCustomer,
  deleteCustomer,
  resetAllPaymentData
} = require('../controllers/customerController');

// Get all customers
router.get('/', getAllCustomers);

// Search customers by name
router.get('/search', searchCustomers);

// Reset all payment data (maintenance endpoint)
router.post('/reset-payment-data', resetAllPaymentData);

// Get single customer by ID
router.get('/:id', getCustomerById);

// Add new customer
router.post('/', addCustomer);

// Update customer payment
router.put('/:id/payment', updatePayment);

// Update customer details
router.put('/:id', updateCustomer);

// Delete customer
router.delete('/:id', deleteCustomer);

module.exports = router;

