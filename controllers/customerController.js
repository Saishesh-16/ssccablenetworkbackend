/**
 * Customer Controller
 * Handles all customer-related business logic
 */

const Customer = require('../models/Customer');
const Payment = require('../models/Payment');

/**
 * Get all customers
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: error.message
    });
  }
};

/**
 * Search customers by name with filters (case-insensitive, partial match)
 */
exports.searchCustomers = async (req, res) => {
  try {
    const { name, status, paymentPlan, startDate, endDate } = req.query;
    
    // Build query
    let query = {};
    
    // Name search
    if (name && name.trim() !== '') {
      query.name = { $regex: name.trim(), $options: 'i' };
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Payment plan filter
    if (paymentPlan && paymentPlan !== 'all') {
      query.paymentPlan = paymentPlan;
    }
    
    // Date range filter (for nextDueDate)
    if (startDate || endDate) {
      query.nextDueDate = {};
      if (startDate) {
        query.nextDueDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.nextDueDate.$lte = new Date(endDate);
      }
    }
    
    const customers = await Customer.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      count: customers.length,
      data: customers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching customers',
      error: error.message
    });
  }
};

/**
 * Get single customer by ID
 */
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: error.message
    });
  }
};

/**
 * Add new customer
 */
exports.addCustomer = async (req, res) => {
  try {
    const { name, paymentPlan } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Customer name is required'
      });
    }
    
    // Generate a unique serial number if not provided
    const serialNumber = `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create customer
    const customerData = {
      serialNumber: serialNumber,
      name: name.trim(),
      paymentPlan: paymentPlan || 'Monthly',
      notes: req.body.notes || ''
    };
    
    // Set initial dates if payment plan is provided
    if (paymentPlan) {
      const today = new Date();
      customerData.lastPaidDate = today;
      customerData.nextDueDate = new Customer(customerData).calculateNextDueDate(today);
      customerData.status = 'Paid';
    }
    
    const customer = await Customer.create(customerData);
    
    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding customer',
      error: error.message
    });
  }
};

/**
 * Update customer payment
 */
exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentDate, status, paymentPlan } = req.body;
    
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Update payment plan if provided
    if (paymentPlan) {
      customer.paymentPlan = paymentPlan;
    }
    
    // Update payment date and calculate next due date
    if (paymentDate) {
      const paidDate = new Date(paymentDate);
      customer.lastPaidDate = paidDate;
      customer.nextDueDate = customer.calculateNextDueDate(paidDate);
    }
    
    // Update status
    if (status) {
      customer.status = status;
      
      // If marking as "Due but Active" and nextDueDate is in the past, advance it by one payment period
      if (status === 'Due but Active' && customer.nextDueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(customer.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        // If due date has passed, advance it by one payment period
        if (dueDate < today) {
          customer.nextDueDate = customer.calculateNextDueDate(customer.nextDueDate);
        }
      }
    } else if (paymentDate) {
      // Auto-set status to Paid if payment date is provided
      customer.status = 'Paid';
      customer.daysOverdue = 0; // Reset overdue days
    }
    
    await customer.save();
    
    // Create payment history record
    if (paymentDate || status) {
      const paymentPlan = req.body.paymentPlan || customer.paymentPlan;
      const paymentStatus = status || (paymentDate ? 'Paid' : customer.status);
      const paymentAmount = paymentPlan === 'Monthly' ? 250 : 
                           paymentPlan === 'Half-Yearly' ? 1500 : 
                           paymentPlan === 'Yearly' ? 3000 : 250;
      
      await Payment.create({
        customerId: customer._id,
        amount: paymentAmount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentPlan: paymentPlan,
        status: paymentStatus,
        notes: req.body.paymentNotes || ''
      });
    }
    
    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment',
      error: error.message
    });
  }
};

/**
 * Update customer details
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, paymentPlan } = req.body;
    
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    if (name) customer.name = name.trim();
    if (paymentPlan) customer.paymentPlan = paymentPlan;
    if (req.body.notes !== undefined) customer.notes = req.body.notes.trim();
    
    await customer.save();
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: error.message
    });
  }
};

/**
 * Delete customer
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: error.message
    });
  }
};

/**
 * Reset all customer payment data (for fresh deployment)
 * Clears lastPaidDate, nextDueDate, status, and daysOverdue for all customers
 */
exports.resetAllPaymentData = async (req, res) => {
  try {
    // Reset all customer payment fields
    const result = await Customer.updateMany(
      {},
      {
        $set: {
          lastPaidDate: null,
          nextDueDate: null,
          status: 'Due but Active',
          daysOverdue: 0
        }
      }
    );
    
    // Optionally clear all payment history
    const { clearHistory } = req.query;
    let paymentHistoryCleared = false;
    let deletedPaymentsCount = 0;
    
    if (clearHistory === 'true') {
      const paymentResult = await Payment.deleteMany({});
      paymentHistoryCleared = true;
      deletedPaymentsCount = paymentResult.deletedCount;
    }
    
    res.json({
      success: true,
      message: 'All customer payment data reset successfully',
      customersUpdated: result.modifiedCount,
      paymentHistoryCleared: paymentHistoryCleared,
      deletedPaymentsCount: deletedPaymentsCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting payment data',
      error: error.message
    });
  }
};

