/**
 * Payment Controller
 * Handles payment history operations
 */

const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

/**
 * Get payment history for a customer
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { limit = 50 } = req.query;
    
    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    const payments = await Payment.find({ customerId })
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment history',
      error: error.message
    });
  }
};

/**
 * Get all payments (with customer details)
 */
exports.getAllPayments = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    let query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.paymentDate.$lte = new Date(endDate);
      }
    }
    
    const payments = await Payment.find(query)
      .populate('customerId', 'name serialNumber')
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

/**
 * Clear payment history for a customer
 */
exports.clearPaymentHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Delete all payments for this customer
    const result = await Payment.deleteMany({ customerId });
    
    res.json({
      success: true,
      message: `Payment history cleared successfully. Deleted ${result.deletedCount} payment record(s).`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing payment history',
      error: error.message
    });
  }
};

/**
 * Update payment status to Paid
 */
exports.markPaymentAsPaid = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Find and update the payment
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status: 'Paid' },
      { new: true }
    );
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment marked as paid successfully',
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
};

