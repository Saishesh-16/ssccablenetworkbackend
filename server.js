/**
 * Main Server File
 * Entry point for the Express application
 */

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
require('dotenv').config();

// Import routes
const customerRoutes = require('./routes/customerRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware
// CORS configuration - allow both localhost and production domains
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      process.env.FRONTEND_URL
    ].filter(Boolean); // Remove undefined values
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow any localhost origin
      if (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        callback(null, true);
      } 
      // In production, allow Render domains (*.onrender.com)
      else if (process.env.NODE_ENV === 'production' && origin.includes('.onrender.com')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SSC Bethigal Cable Network API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      customers: '/api/customers',
      dashboard: '/api/dashboard',
      payments: '/api/payments'
    },
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint (before other routes for quick access)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/customers', customerRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);

// Log registered routes on startup
console.log('📋 Registered API Routes:');
console.log('   GET  /api/health');
console.log('   GET  /api/customers');
console.log('   GET  /api/customers/search');
console.log('   GET  /api/customers/:id');
console.log('   POST /api/customers');
console.log('   PUT  /api/customers/:id/payment');
console.log('   PUT  /api/customers/:id');
console.log('   DELETE /api/customers/:id');
console.log('   GET  /api/dashboard');
console.log('   GET  /api/payments');
console.log('   GET  /api/payments/customer/:customerId');

// 404 handler - must be after all routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/customers',
      'GET /api/customers/search',
      'GET /api/dashboard',
      'GET /api/payments'
    ]
  });
});

// Error handling middleware - must be last
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      origin: req.headers.origin,
      error: process.env.NODE_ENV === 'development' ? err.message : 'Access denied'
    });
  }
  
  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    path: req.path,
    method: req.method
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API available at http://0.0.0.0:${PORT}/api`);
  console.log(`✅ All routes registered successfully`);
});

