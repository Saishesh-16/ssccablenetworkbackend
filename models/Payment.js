/**
 * Payment Model
 * Tracks all payment transactions for customers
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    default: 250 // Default monthly plan cost
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentPlan: {
    type: String,
    enum: ['Monthly', 'Half-Yearly', 'Yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Due but Active'],
    required: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
paymentSchema.index({ customerId: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

