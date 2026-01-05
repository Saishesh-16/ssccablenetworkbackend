# Reset Payment Data Script

This script allows you to reset all customer payment data for a fresh deployment.

## What it does:

- Resets `lastPaidDate` to `null` for all customers
- Resets `nextDueDate` to `null` for all customers
- Sets `status` to `'Due but Active'` for all customers
- Resets `daysOverdue` to `0` for all customers
- Optionally clears all payment history records

## Usage:

### Option 1: Using the Script (Recommended for deployment)

```bash
# Reset payment data only (keeps payment history)
node scripts/reset-payment-data.js

# Reset payment data AND clear all payment history
node scripts/reset-payment-data.js --clear-history
```

### Option 2: Using the API Endpoint

You can also call the API endpoint directly:

```bash
# Reset payment data only
curl -X POST http://localhost:3000/api/customers/reset-payment-data

# Reset payment data and clear history
curl -X POST http://localhost:3000/api/customers/reset-payment-data?clearHistory=true
```

## Important Notes:

⚠️ **WARNING**: This operation cannot be undone! Make sure to backup your database before running this script.

## When to use:

- Before deploying to production for the first time
- When you want to start fresh with payment tracking
- When migrating to a new system

## Example Output:

```
🚀 Starting payment data reset...
   Clear history: No

✅ Connected to database
🔄 Resetting customer payment data...
✅ Updated 150 customers

✨ Payment data reset completed successfully!
   - Customers updated: 150
   - Payment history cleared: No (use --clear-history to clear)
✅ Database connection closed
```

