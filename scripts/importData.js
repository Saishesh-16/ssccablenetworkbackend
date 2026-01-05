/**
 * Data Import Script
 * Imports customer data from CSV file to MongoDB
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/Customer');
const connectDB = require('../config/database');

/**
 * Import customers from CSV
 */
async function importData() {
  try {
    // Connect to database
    await connectDB();
    
    // Read CSV file
    const csvFilePath = path.join(__dirname, '../Data/SSC EXCEL.csv');
    const customers = [];
    
    console.log('📖 Reading CSV file...');
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // Clean the data
          const serialNumber = (row['Serial Number'] || '').trim();
          const name = (row['Customer Name'] || '').trim();
          
          // Skip empty rows
          if (!serialNumber && !name) {
            return;
          }
          
          // Handle scientific notation serial numbers
          let cleanSerialNumber = serialNumber;
          if (serialNumber.includes('E+') || serialNumber.includes('e+')) {
            // Convert scientific notation to string
            const num = parseFloat(serialNumber);
            if (!isNaN(num)) {
              cleanSerialNumber = num.toString();
            } else {
              cleanSerialNumber = serialNumber; // Keep original if conversion fails
            }
          }
          
          if (name) {
            customers.push({
              serialNumber: cleanSerialNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: name,
              paymentPlan: 'Monthly',
              status: 'Due but Active'
            });
          }
        })
        .on('end', async () => {
          try {
            console.log(`📊 Found ${customers.length} customers in CSV`);
            
            // Check for duplicates
            const existingCustomers = await Customer.find();
            const existingSerialNumbers = new Set(existingCustomers.map(c => c.serialNumber));
            
            const newCustomers = customers.filter(c => !existingSerialNumbers.has(c.serialNumber));
            const duplicates = customers.length - newCustomers.length;
            
            if (duplicates > 0) {
              console.log(`⚠️  Skipping ${duplicates} duplicate customers`);
            }
            
            if (newCustomers.length > 0) {
              // Insert customers
              const result = await Customer.insertMany(newCustomers, { ordered: false });
              console.log(`✅ Successfully imported ${result.length} customers`);
            } else {
              console.log('ℹ️  No new customers to import');
            }
            
            // Show summary
            const totalCustomers = await Customer.countDocuments();
            console.log(`\n📈 Total customers in database: ${totalCustomers}`);
            
            resolve();
            process.exit(0);
          } catch (error) {
            console.error('❌ Error importing data:', error.message);
            reject(error);
            process.exit(1);
          }
        })
        .on('error', (error) => {
          console.error('❌ Error reading CSV:', error.message);
          reject(error);
          process.exit(1);
        });
    });
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run import
if (require.main === module) {
  importData();
}

module.exports = importData;

