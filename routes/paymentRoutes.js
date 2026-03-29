// routes/paymentRoutes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const Bus = require('../models/busModel');

// Khalti Configuration
const KHALTI_CONFIG = {
  sandbox: {
    apiUrl: 'https://dev.khalti.com/api/v2',
    secretKey: process.env.KHALTI_SECRET_KEY || 'test_secret_key_68791341fdd94846a146f0457ff7b455'
  },
  production: {
    apiUrl: 'https://khalti.com/api/v2',
    secretKey: process.env.KHALTI_SECRET_KEY_LIVE
  }
};

const getKhaltiConfig = () => {
  return process.env.NODE_ENV === 'production' ? KHALTI_CONFIG.production : KHALTI_CONFIG.sandbox;
};

// Initiate Khalti Payment
router.post('/khalti/initiate', async (req, res) => {
  try {
    console.log('Initiating Khalti payment with data:', req.body);
    
    const config = getKhaltiConfig();
    
    const response = await axios.post(
      `${config.apiUrl}/epayment/initiate/`,
      req.body,
      {
        headers: {
          'Authorization': `Key ${config.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Khalti initiation response:', response.data);
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('Khalti initiation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.detail || 'Failed to initiate payment',
      error: error.response?.data
    });
  }
});

// Verify Khalti Payment
router.post('/khalti/verify', async (req, res) => {
  try {
    const { pidx, transactionId } = req.body;
    
    console.log('Verifying Khalti payment:', { pidx, transactionId });
    
    const config = getKhaltiConfig();
    
    const response = await axios.post(
      `${config.apiUrl}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          'Authorization': `Key ${config.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Khalti verification response:', response.data);
    
    const paymentStatus = response.data.status;
    
    if (paymentStatus === 'Completed') {
      // Get temporary booking data from request or session
      // You can store temp booking in database with status 'pending_payment'
      // For now, we'll just return success
      
      res.json({
        success: true,
        data: response.data,
        message: 'Payment verified successfully'
      });
    } else {
      res.json({
        success: false,
        message: `Payment ${paymentStatus}`,
        data: response.data
      });
    }
  } catch (error) {
    console.error('Khalti verification error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.response?.data
    });
  }
});

// Initiate eSewa Payment (Optional)
router.post('/esewa/initiate', async (req, res) => {
  try {
    const { amount, purchase_order_id, product_name, customer_info } = req.body;
    
    // eSewa payment initiation logic
    // You need to implement eSewa integration similarly
    
    // For now, return a mock response
    res.json({
      success: true,
      data: {
        payment_url: `https://esewa.com.np/epay/main?amt=${amount}&pid=${purchase_order_id}&scd=EPAYTEST&su=http://localhost:4200/payment-callback&fu=http://localhost:4200/payment-failed`
      }
    });
  } catch (error) {
    console.error('eSewa initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate eSewa payment'
    });
  }
});

// Verify eSewa Payment (Optional)
router.post('/esewa/verify', async (req, res) => {
  try {
    const { refId, oid, amt } = req.body;
    
    // eSewa payment verification logic
    // Implement eSewa verification
    
    res.json({
      success: true,
      data: { refId, oid, amt }
    });
  } catch (error) {
    console.error('eSewa verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify eSewa payment'
    });
  }
});

// Create booking after successful payment
router.post('/create-booking', async (req, res) => {
  try {
    const bookingData = req.body;
    
    // Create new booking
    const booking = new Booking({
      bookingId: generateBookingId(),
      userId: bookingData.userId,
      busId: bookingData.busId,
      seats: bookingData.seats,
      totalAmount: bookingData.totalAmount,
      taxAmount: bookingData.taxAmount,
      journeyDate: bookingData.journeyDate,
      paymentMethod: bookingData.paymentMethod,
      paymentStatus: 'paid',
      status: 'confirmed'
    });
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

// Helper function to generate booking ID
function generateBookingId() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TRE${year}${month}${day}${random}`;
}

module.exports = router;