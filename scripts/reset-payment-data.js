/**
 * Reset Payment Data Script
 * This script resets all customer payment data for a fresh deployment
 * 
 * Usage: node scripts/reset-payment-data.js [--clear-history]
 * 
 * Options:
 *   --clear-history    Also delete all payment history records
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const connectDB = require('../config/database');

async function resetPaymentData(clearHistory = false) {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Reset all customer payment fields
    console.log('🔄 Resetting customer payment data...');
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
    console.log(`✅ Updated ${result.modifiedCount} customers`);

    // Optionally clear payment history
    if (clearHistory) {
      console.log('🔄 Clearing payment history...');
      const paymentResult = await Payment.deleteMany({});
      console.log(`✅ Deleted ${paymentResult.deletedCount} payment records`);
    }

    console.log('\n✨ Payment data reset completed successfully!');
    console.log(`   - Customers updated: ${result.modifiedCount}`);
    if (clearHistory) {
      console.log(`   - Payment history cleared: Yes`);
    } else {
      console.log(`   - Payment history cleared: No (use --clear-history to clear)`);
    }

    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting payment data:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const clearHistory = args.includes('--clear-history');

console.log('🚀 Starting payment data reset...');
console.log(`   Clear history: ${clearHistory ? 'Yes' : 'No'}\n`);

resetPaymentData(clearHistory);

