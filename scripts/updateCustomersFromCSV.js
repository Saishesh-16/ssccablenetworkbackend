/**
 * Update Customer Data from CSV
 * Updates existing customers with additional details from CSV file
 * Matches customers by name and updates/adds new fields
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/Customer');
const connectDB = require('../config/database');

/**
 * Clean phone number (remove quotes and format)
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = phone.trim();
  // Remove leading quotes and commas
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
  cleaned = cleaned.replace(/^,+/g, '');
  // Extract first phone number if multiple
  const firstPhone = cleaned.split(',')[0].split(':')[0].trim();
  return firstPhone || '';
}

/**
 * Clean serial number
 */
function cleanSerialNumber(serial) {
  if (!serial) return '';
  let cleaned = serial.trim();
  // Remove leading quotes
  cleaned = cleaned.replace(/^['"]+|['"]+$/g, '');
  return cleaned;
}

/**
 * Update customers from CSV
 */
async function updateCustomersFromCSV() {
  try {
    // Connect to database
    await connectDB();
    
    // Read CSV file
    const csvFilePath = path.join(__dirname, '../Data/CUSTOMERS_LIST_2026-01-0411_01_27.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ CSV file not found: ${csvFilePath}`);
      console.log('Please copy the CSV file to Backend/Data/ folder');
      process.exit(1);
    }
    
    const csvData = [];
    
    console.log('📖 Reading CSV file...');
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          // Extract data from CSV columns
          const name = (row['Customer_Name'] || '').trim();
          
          // Skip empty rows
          if (!name) {
            return;
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
        .on('end', async () => {
          try {
            console.log(`📊 Found ${csvData.length} customers in CSV`);
            
            let updated = 0;
            let created = 0;
            let errors = 0;
            
            // Update or create each customer by matching name
            for (const csvCustomer of csvData) {
              try {
                // Find customer by name (case-insensitive, exact match)
                const customer = await Customer.findOne({
                  name: { $regex: new RegExp(`^${csvCustomer.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
                });
                
                if (customer) {
                  // Update existing customer with new fields (only if CSV has values)
                  const updateData = {};
                  
                  if (csvCustomer.accountNumber) updateData.accountNumber = csvCustomer.accountNumber;
                  if (csvCustomer.mobileNumber) updateData.mobileNumber = csvCustomer.mobileNumber;
                  if (csvCustomer.address) updateData.address = csvCustomer.address;
                  if (csvCustomer.pinCode) updateData.pinCode = csvCustomer.pinCode;
                  if (csvCustomer.city) updateData.city = csvCustomer.city;
                  if (csvCustomer.caf) updateData.caf = csvCustomer.caf;
                  if (csvCustomer.vcNumber) updateData.vcNumber = csvCustomer.vcNumber;
                  
                  // Only update if there's data to update
                  if (Object.keys(updateData).length > 0) {
                    await Customer.updateOne(
                      { _id: customer._id },
                      { $set: updateData }
                    );
                    updated++;
                  }
                } else {
                  // Create new customer
                  const serialNumber = csvCustomer.serialNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                  
                  const newCustomer = new Customer({
                    serialNumber: serialNumber,
                    name: csvCustomer.name,
                    paymentPlan: 'Monthly',
                    status: 'Due but Active',
                    accountNumber: csvCustomer.accountNumber || '',
                    mobileNumber: csvCustomer.mobileNumber || '',
                    address: csvCustomer.address || '',
                    pinCode: csvCustomer.pinCode || '',
                    city: csvCustomer.city || '',
                    caf: csvCustomer.caf || '',
                    vcNumber: csvCustomer.vcNumber || ''
                  });
                  
                  await newCustomer.save();
                  created++;
                  console.log(`✅ Created new customer: ${csvCustomer.name}`);
                }
              } catch (error) {
                errors++;
                console.error(`❌ Error processing ${csvCustomer.name}:`, error.message);
              }
            }
            
            console.log(`\n✅ Successfully updated ${updated} existing customers`);
            console.log(`✅ Successfully created ${created} new customers`);
            if (errors > 0) {
              console.log(`⚠️  ${errors} customers had errors during processing`);
            }
            
            // Show summary
            const totalCustomers = await Customer.countDocuments();
            console.log(`\n📈 Total customers in database: ${totalCustomers}`);
            
            resolve();
            process.exit(0);
          } catch (error) {
            console.error('❌ Error updating data:', error.message);
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
    console.error('❌ Update failed:', error.message);
    process.exit(1);
  }
}

// Run update
if (require.main === module) {
  updateCustomersFromCSV();
}

module.exports = updateCustomersFromCSV;

