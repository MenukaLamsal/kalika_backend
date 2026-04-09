// const express = require('express');
// const axios = require('axios');
// const router = express.Router();
// const { verifyToken, isAuthenticated } = require('../middleware'); // Import middleware
// const Booking = require('../models/bookingModel');

// // Khalti Configuration
// const KHALTI_CONFIG = {
//   sandbox: {
//     apiUrl: 'https://dev.khalti.com/api/v2',
//     secretKey: process.env.KHALTI_SECRET_KEY || 'test_secret_key_68791341fdd94846a146f0457ff7b455'
//   },
//   production: {
//     apiUrl: 'https://khalti.com/api/v2',
//     secretKey: process.env.KHALTI_SECRET_KEY_LIVE
//   }
// };

// const getKhaltiConfig = () => {
//   return process.env.NODE_ENV === 'production' ? KHALTI_CONFIG.production : KHALTI_CONFIG.sandbox;
// };

// // Initiate Khalti Payment (Protected - User must be logged in)
// router.post('/khalti/initiate', verifyToken, async (req, res) => {
//   try {
//     console.log('Initiating Khalti payment for user:', req.user.id);
//     console.log('Payment data:', req.body);
    
//     const config = getKhaltiConfig();
    
//     const response = await axios.post(
//       `${config.apiUrl}/epayment/initiate/`,
//       req.body,
//       {
//         headers: {
//           'Authorization': `Key ${config.secretKey}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
    
//     console.log('Khalti initiation response:', response.data);
    
//     res.json({
//       success: true,
//       data: response.data
//     });
//   } catch (error) {
//     console.error('Khalti initiation error:', error.response?.data || error.message);
//     res.status(500).json({
//       success: false,
//       message: error.response?.data?.detail || 'Failed to initiate payment',
//       error: error.response?.data
//     });
//   }
// });

// // Verify Khalti Payment (Protected)
// router.post('/khalti/verify', verifyToken, async (req, res) => {
//   try {
//     const { pidx, transactionId } = req.body;
    
//     console.log('Verifying Khalti payment for user:', req.user.id);
//     console.log('Verification data:', { pidx, transactionId });
    
//     const config = getKhaltiConfig();
    
//     const response = await axios.post(
//       `${config.apiUrl}/epayment/lookup/`,
//       { pidx },
//       {
//         headers: {
//           'Authorization': `Key ${config.secretKey}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );
    
//     console.log('Khalti verification response:', response.data);
    
//     const paymentStatus = response.data.status;
    
//     if (paymentStatus === 'Completed') {
//       res.json({
//         success: true,
//         data: response.data,
//         message: 'Payment verified successfully'
//       });
//     } else {
//       res.json({
//         success: false,
//         message: `Payment ${paymentStatus}`,
//         data: response.data
//       });
//     }
//   } catch (error) {
//     console.error('Khalti verification error:', error.response?.data || error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to verify payment',
//       error: error.response?.data
//     });
//   }
// });

// // Create booking after successful payment (Protected)
// router.post('/create-booking', verifyToken, async (req, res) => {
//   try {
//     const bookingData = req.body;
//     bookingData.userId = req.user.id; // Add user ID from token
    
//     // Generate booking ID
//     const bookingId = generateBookingId();
    
//     // Create new booking
//     const booking = new Booking({
//       bookingId: bookingId,
//       userId: bookingData.userId,
//       busId: bookingData.busId,
//       seats: bookingData.seats,
//       totalAmount: bookingData.totalAmount,
//       taxAmount: bookingData.taxAmount,
//       journeyDate: bookingData.journeyDate,
//       paymentMethod: bookingData.paymentMethod,
//       paymentStatus: 'paid',
//       status: 'confirmed',
//       bookingDate: new Date()
//     });
    
//     await booking.save();
    
//     res.json({
//       success: true,
//       message: 'Booking created successfully',
//       data: booking
//     });
//   } catch (error) {
//     console.error('Create booking error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create booking',
//       error: error.message
//     });
//   }
// });

// // Public endpoint for eSewa initiation (no authentication required for redirect)
// router.post('/esewa/initiate', async (req, res) => {
//   try {
//     const { amount, purchase_order_id, product_name, customer_info, return_url } = req.body;
    
//     // eSewa payment URL
//     const esewaUrl = 'https://esewa.com.np/epay/main';
//     const successUrl = `${return_url || 'http://localhost:4200/payment-callback'}?status=success`;
//     const failureUrl = `${return_url || 'http://localhost:4200/payment-callback'}?status=failure`;
    
//     const paymentUrl = `${esewaUrl}?amt=${amount}&pid=${purchase_order_id}&scd=EPAYTEST&su=${encodeURIComponent(successUrl)}&fu=${encodeURIComponent(failureUrl)}`;
    
//     res.json({
//       success: true,
//       data: {
//         payment_url: paymentUrl,
//         purchase_order_id: purchase_order_id
//       }
//     });
//   } catch (error) {
//     console.error('eSewa initiation error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to initiate eSewa payment'
//     });
//   }
// });

// // Helper function to generate booking ID
// function generateBookingId() {
//   const date = new Date();
//   const year = date.getFullYear().toString().slice(-2);
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');
//   const day = date.getDate().toString().padStart(2, '0');
//   const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//   return `TRE${year}${month}${day}${random}`;
// }

// module.exports = router;



// kalika_backend/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/bookingModel');
// const { verifyToken } = require('../middleware/auth');

// const express = require('express');
// const axios = require('axios');
// const router = express.Router();
const { verifyToken, isAuthenticated } = require('../middleware'); // Import middleware
// const Booking = require('../models/bookingModel');

// Khalti payment initiation
router.post('/khalti/initiate', verifyToken, async (req, res) => {
    try {
        const {
            return_url,
            website_url,
            amount,
            purchase_order_id,
            purchase_order_name,
            customer_info
        } = req.body;

        const khaltiSecretKey = process.env.KHALTI_SECRET_KEY || 'test_secret_key_68791341fdd94846a146f0457ff7b455';

        const response = await fetch('https://khalti.com/api/v2/epayment/initiate/', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${khaltiSecretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                return_url,
                website_url,
                amount,
                purchase_order_id,
                purchase_order_name,
                customer_info
            })
        });

        const data = await response.json();

        if (data.pidx) {
            // Store temporary booking data
            await TempBooking.findOneAndUpdate(
                { purchaseOrderId: purchase_order_id },
                {
                    purchaseOrderId: purchase_order_id,
                    userId: req.user.userId,
                    bookingData: req.body.bookingData,
                    pidx: data.pidx,
                    createdAt: new Date()
                },
                { upsert: true }
            );

            res.json({
                success: true,
                data: {
                    pidx: data.pidx,
                    payment_url: data.payment_url,
                    expires_at: data.expires_at,
                    expires_in: data.expires_in
                }
            });
        } else {
            res.json({
                success: false,
                message: data.detail || 'Failed to initiate payment'
            });
        }
    } catch (error) {
        console.error('Khalti initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initiating payment',
            error: error.message
        });
    }
});

// Khalti payment verification
router.post('/khalti/verify', verifyToken, async (req, res) => {
    try {
        const { pidx, transactionId } = req.body;

        const khaltiSecretKey = process.env.KHALTI_SECRET_KEY || 'test_secret_key_68791341fdd94846a146f0457ff7b455';

        const response = await fetch('https://khalti.com/api/v2/epayment/lookup/', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${khaltiSecretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pidx })
        });

        const data = await response.json();

        if (data.status === 'Completed') {
            // Get temporary booking data
            const tempBooking = await TempBooking.findOne({ pidx });
            
            if (tempBooking && tempBooking.bookingData) {
                // Create actual booking
                const bookingData = tempBooking.bookingData;
                
                const booking = new Booking({
                    userId: req.user.userId,
                    busId: bookingData.busId,
                    seats: bookingData.seats,
                    totalAmount: bookingData.totalAmount,
                    taxAmount: bookingData.taxAmount,
                    journeyDate: bookingData.journeyDate,
                    paymentMethod: 'khalti',
                    paymentStatus: 'completed',
                    bookingStatus: 'confirmed',
                    passengerDetails: bookingData.passengers,
                    contactNumber: bookingData.passengers[0]?.phone,
                    email: bookingData.passengers[0]?.email
                });

                await booking.save();
                
                // Clean up temp booking
                await TempBooking.deleteOne({ pidx });

                res.json({
                    success: true,
                    message: 'Payment verified and booking created',
                    data: {
                        bookingId: booking.bookingId,
                        booking: booking
                    }
                });
            } else {
                res.json({
                    success: false,
                    message: 'Booking data not found'
                });
            }
        } else {
            res.json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('Khalti verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
});

// eSewa payment initiation
router.post('/esewa/initiate', verifyToken, async (req, res) => {
    try {
        const { amount, purchase_order_id, product_name, customer_info } = req.body;
        
        const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment-callback?status=success`;
        const failureUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/payment-callback?status=failure`;
        
        const paymentUrl = `https://rc-epay.esewa.com.np/api/epay/main/v2/form?amount=${amount}&tax_amount=0&total_amount=${amount}&transaction_uuid=${purchase_order_id}&product_code=EPAYTEST&product_service_charge=0&product_delivery_charge=0&success_url=${encodeURIComponent(successUrl)}&failure_url=${encodeURIComponent(failureUrl)}`;
        
        // Store temp booking data
        await TempBooking.findOneAndUpdate(
            { purchaseOrderId: purchase_order_id },
            {
                purchaseOrderId: purchase_order_id,
                userId: req.user.userId,
                bookingData: req.body.bookingData,
                createdAt: new Date()
            },
            { upsert: true }
        );
        
        res.json({
            success: true,
            data: {
                payment_url: paymentUrl,
                transaction_uuid: purchase_order_id
            }
        });
    } catch (error) {
        console.error('eSewa initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error initiating eSewa payment',
            error: error.message
        });
    }
});

// eSewa payment verification
router.post('/esewa/verify', verifyToken, async (req, res) => {
    try {
        const { transactionId, amount, productCode, purchaseOrderId } = req.body;
        
        const response = await fetch('https://rc-epay.esewa.com.np/api/epay/transaction/status/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transaction_id: transactionId,
                amount: amount,
                product_code: productCode || 'EPAYTEST'
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'COMPLETE') {
            const tempBooking = await TempBooking.findOne({ purchaseOrderId });
            
            if (tempBooking && tempBooking.bookingData) {
                const bookingData = tempBooking.bookingData;
                
                const booking = new Booking({
                    userId: req.user.userId,
                    busId: bookingData.busId,
                    seats: bookingData.seats,
                    totalAmount: bookingData.totalAmount,
                    taxAmount: bookingData.taxAmount,
                    journeyDate: bookingData.journeyDate,
                    paymentMethod: 'esewa',
                    paymentStatus: 'completed',
                    bookingStatus: 'confirmed',
                    passengerDetails: bookingData.passengers,
                    contactNumber: bookingData.passengers[0]?.phone,
                    email: bookingData.passengers[0]?.email
                });
                
                await booking.save();
                await TempBooking.deleteOne({ purchaseOrderId });
                
                res.json({
                    success: true,
                    message: 'Payment verified and booking created',
                    data: { bookingId: booking.bookingId }
                });
            } else {
                res.json({
                    success: false,
                    message: 'Booking data not found'
                });
            }
        } else {
            res.json({
                success: false,
                message: 'Payment verification failed'
            });
        }
    } catch (error) {
        console.error('eSewa verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
});

// Temp Booking Schema (add this to your models)
const tempBookingSchema = new mongoose.Schema({
    purchaseOrderId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bookingData: { type: Object, required: true },
    pidx: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto delete after 1 hour
});

const TempBooking = mongoose.models.TempBooking || mongoose.model('TempBooking', tempBookingSchema);

module.exports = router;