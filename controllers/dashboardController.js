/**
 * Dashboard Controller
 * Handles dashboard statistics and analytics
 */

const Customer = require('../models/Customer');

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get all customers
    const allCustomers = await Customer.find();
    
    // Calculate statistics
    const totalCustomers = allCustomers.length;
    const paidCustomers = allCustomers.filter(c => c.status === 'Paid').length;
    const dueCustomers = allCustomers.filter(c => c.status === 'Due but Active').length;
    const overdueCustomers = allCustomers.filter(c => c.status === 'Overdue').length;
    
    // Get upcoming due customers (next 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const upcomingDue = await Customer.find({
      nextDueDate: {
        $gte: today,
        $lte: nextWeek
      },
      status: { $ne: 'Paid' }
    }).sort({ nextDueDate: 1 }).limit(20);
    
    res.json({
      success: true,
      data: {
        totalCustomers,
        paidCustomers,
        dueCustomers,
        overdueCustomers,
        upcomingDue: upcomingDue.map(customer => ({
          id: customer._id,
          name: customer.name,
          serialNumber: customer.serialNumber,
          nextDueDate: customer.nextDueDate,
          status: customer.status,
          paymentPlan: customer.paymentPlan
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

