/**
 * Replace All Customers with Data from Latest CSV
 *
 * - Deletes ALL existing customers
 * - Deletes ALL existing payment history
 * - Imports fresh customers from:
 *   Backend/Data/CUSTOMERS_LIST_2026-01-0411_01_27.csv
 *
 * Usage:
 *   From Backend folder:
 *     node scripts/replaceCustomersWithNewCSV.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/Customer');
const Payment = require('../models/Payment');
const connectDB = require('../config/database');

/**
 * Clean phone number (reused from update script)
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.trim();
  // Remove leading/trailing quotes and commas
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
  cleaned = cleaned.replace(/^,+/g, '');
  // Extract first phone number if multiple
  const firstPhone = cleaned.split(',')[0].split(':')[0].trim();
  return firstPhone || '';
}

/**
 * Clean serial number (reused from update script)
 */
function cleanSerialNumber(serial) {
  if (!serial) return '';
  let cleaned = serial.trim();
  // Remove leading/trailing quotes
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
  return cleaned;
}

async function replaceCustomersWithNewCSV() {
  try {
    // 1) Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // 2) Resolve CSV path
    const csvFilePath = path.join(__dirname, '../Data/CUSTOMERS_LIST_2026-01-0411_01_27.csv');

    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ CSV file not found: ${csvFilePath}`);
      console.log('Please make sure the file exists at Backend/Data/ with that exact name.');
      process.exit(1);
    }

    // 3) Read CSV into memory
    const csvData = [];

    console.log('📖 Reading CSV file...');

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          const name = (row['Customer_Name'] || '').trim();
          if (!name) {
            return; // skip empty rows
          }

          csvData.push({
            name: name,
            accountNumber: (row['Account_Number'] || '').trim(),
            caf: (row['CAF'] || '').trim(),
            address: (row['Installation_Address'] || '').trim(),
            pinCode: (row['Pin_Code'] || '').trim(),
            mobileNumber: cleanPhoneNumber(row['Mobile_Number'] || ''),
            city: (row['City'] || '').trim(),
            vcNumber: cleanSerialNumber(row['VC_Number'] || ''),
            serialNumber: cleanSerialNumber(row['Serial_Number'] || '')
          });
        })
        .on('end', () => {
          console.log(`📊 Found ${csvData.length} customers in CSV`);
          resolve();
        })
        .on('error', (error) => {
          console.error('❌ Error reading CSV:', error.message);
          reject(error);
        });
    });

    // 4) DELETE existing data
    console.log('\n🗑  Deleting ALL existing payment records...');
    const paymentResult = await Payment.deleteMany({});
    console.log(`   ✅ Deleted ${paymentResult.deletedCount} payment records`);

    console.log('🗑  Deleting ALL existing customers...');
    const customerResult = await Customer.deleteMany({});
    console.log(`   ✅ Deleted ${customerResult.deletedCount} customers`);

    // 5) INSERT new customers from CSV
    if (csvData.length === 0) {
      console.log('ℹ️  CSV has no customer rows. No customers imported.');
    } else {
      console.log('\n📥 Importing customers from new CSV...');

      const customersToInsert = csvData.map((c) => {
        const serialNumber =
          c.serialNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
          serialNumber: serialNumber,
          name: c.name,
          paymentPlan: 'Monthly',
          status: 'Due but Active',
          accountNumber: c.accountNumber || '',
          mobileNumber: c.mobileNumber || '',
          address: c.address || '',
          pinCode: c.pinCode || '',
          city: c.city || '',
          caf: c.caf || '',
          vcNumber: c.vcNumber || ''
        };
      });

      const result = await Customer.insertMany(customersToInsert, { ordered: false });
      console.log(`✅ Successfully imported ${result.length} customers from new CSV`);
    }

    // 6) Summary
    const totalCustomers = await Customer.countDocuments();
    console.log(`\n📈 Total customers in database now: ${totalCustomers}`);

    // 7) Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('\n✨ Replacement completed: old data removed, new CSV data imported successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error replacing customers with new CSV:', error);
    try {
      await mongoose.connection.close();
    } catch (e) {
      // ignore
    }
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  console.log('🚀 Starting full replace of customer data using latest CSV...\n');
  replaceCustomersWithNewCSV();
}

module.exports = replaceCustomersWithNewCSV;


