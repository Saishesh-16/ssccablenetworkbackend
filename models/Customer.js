/**
 * Customer Model
 * Schema for customer data with payment tracking
 */

const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  serialNumber: {
    type: String,
    required: true,
    trim: true,
    index: true // For faster searches
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true // For faster name searches
  },
  paymentPlan: {
    type: String,
    enum: ['Monthly', 'Half-Yearly', 'Yearly'],
    default: 'Monthly'
  },
  lastPaidDate: {
    type: Date,
    default: null
  },
  nextDueDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['Paid', 'Due but Active', 'Overdue'],
    default: 'Due but Active'
  },
  daysOverdue: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  accountNumber: {
    type: String,
    trim: true,
    default: ''
  },
  mobileNumber: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  pinCode: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  caf: {
    type: String,
    trim: true,
    default: ''
  },
  vcNumber: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
customerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-update status and calculate days overdue based on nextDueDate
  if (this.nextDueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(this.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate days overdue
    const diffTime = today - dueDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (dueDate < today) {
      this.status = 'Overdue';
      this.daysOverdue = Math.max(0, diffDays); // Ensure non-negative
    } else if (this.status === 'Paid') {
      // Reset days overdue when paid
      this.daysOverdue = 0;
    } else {
      this.status = 'Due but Active';
      this.daysOverdue = 0;
    }
  }
  
  next();
});

// Method to calculate next due date based on payment plan
customerSchema.methods.calculateNextDueDate = function(paymentDate) {
  const date = new Date(paymentDate);
  let daysToAdd = 0;
  
  switch (this.paymentPlan) {
    case 'Monthly':
      daysToAdd = 30;
      break;
    case 'Half-Yearly':
      daysToAdd = 180;
      break;
    case 'Yearly':
      daysToAdd = 365;
      break;
    default:
      daysToAdd = 30;
  }
  
  date.setDate(date.getDate() + daysToAdd);
  return date;
};

// Static method for case-insensitive name search
customerSchema.statics.searchByName = function(searchTerm) {
  return this.find({
    name: { $regex: searchTerm, $options: 'i' }
  }).sort({ name: 1 });
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

