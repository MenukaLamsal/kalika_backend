const express = require('express');
const router = express.Router();
const Booking = require('../models/bookingModel');
const Bus = require('../models/busModel');
const Route = require('../models/routesModel');
const User = require('../models/userModel');
const { verifyToken, isAdmin } = require('../middleware');

// Helper function to generate booking ID
const generateBookingId = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TRE${year}${month}${day}${hours}${minutes}${random}`;
};

// ==================== USER BOOKING ENDPOINTS ====================

// Create new booking (authenticated users)
router.post('/bookings', verifyToken, async (req, res) => {
    try {
        const {
            busId,
            seats,
            totalAmount,
            taxAmount,
            journeyDate,
            paymentMethod
        } = req.body;

        console.log('Received booking request:', { busId, seats, totalAmount, journeyDate });

        // Validate required fields
        if (!busId || !seats || !seats.length || !totalAmount || !journeyDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: busId, seats, totalAmount, journeyDate are required'
            });
        }

        // Get user details
        const user = await User.findOne({ email: req.user.email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get bus details
        const bus = await Bus.findById(busId).populate('routeId');
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        // Check if bus is active
        if (bus.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Bus is not available for booking'
            });
        }

        // Check if seats are available
        const startOfDay = new Date(journeyDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(journeyDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingBookings = await Booking.find({
            busId: busId,
            journeyDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['confirmed', 'pending'] }
        });

        const bookedSeats = existingBookings.flatMap(b => b.seats.map(s => s.seatNumber));
        const requestedSeats = seats.map(s => s.seatNumber);
        
        const alreadyBooked = requestedSeats.filter(seat => bookedSeats.includes(seat));
        if (alreadyBooked.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Seats ${alreadyBooked.join(', ')} are already booked`,
                bookedSeats: alreadyBooked
            });
        }

        // Calculate duration
        const hours = Math.floor(bus.routeId.distance / 50);
        const minutes = Math.floor((bus.routeId.distance % 50) * 60 / 50);
        const duration = `${hours}h ${minutes}m`;

        // Generate unique booking ID
        const bookingId = generateBookingId();

        // Create booking with explicit bookingId
        const booking = new Booking({
            bookingId: bookingId,
            userId: user._id,
            busId: bus._id,
            routeId: bus.routeId._id,
            busDetails: {
                busNumber: bus.busNumber,
                busName: bus.busName,
                busType: bus.busType,
                operator: bus.busName?.split(' ')[0] || 'Travels'
            },
            routeDetails: {
                origin: bus.routeId.origin,
                destination: bus.routeId.destination,
                departureTime: bus.departureTime || '08:00',
                arrivalTime: bus.arrivalTime || '20:00',
                duration: duration,
                distance: bus.routeId.distance
            },
            seats: seats.map(seat => ({
                seatNumber: seat.seatNumber,
                price: seat.price || bus.fare,
                passengerName: seat.passengerName,
                passengerAge: seat.passengerAge,
                passengerGender: seat.passengerGender,
                passengerPhone: seat.passengerPhone,
                passengerEmail: seat.passengerEmail
            })),
            totalAmount: totalAmount,
            taxAmount: taxAmount,
            journeyDate: new Date(journeyDate),
            paymentMethod: paymentMethod || 'card',
            status: 'confirmed',
            paymentStatus: 'paid'
        });

        // Validate before saving
        const validationError = booking.validateSync();
        if (validationError) {
            console.error('Validation error:', validationError);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: validationError.message
            });
        }

        await booking.save();
        console.log('Booking saved successfully:', booking.bookingId);

        res.status(201).json({
            success: true,
            message: 'Booking confirmed successfully',
            data: {
                bookingId: booking.bookingId,
                booking: booking
            }
        });

    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
});

// Get user's bookings
router.get('/bookings/my-bookings', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        
        const bookings = await Booking.find({ userId: user._id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });

    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// Get single booking by ID
router.get('/bookings/:id', verifyToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', 'firstName lastName email phone');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns this booking or is admin
        const user = await User.findOne({ email: req.user.email });
        if (booking.userId._id.toString() !== user._id.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: booking
        });

    } catch (error) {
        console.error('Get booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
});

// Cancel booking
router.patch('/bookings/:id/cancel', verifyToken, async (req, res) => {
    try {
        const { reason } = req.body;
        
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns this booking
        const user = await User.findOne({ email: req.user.email });
        if (booking.userId.toString() !== user._id.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if booking can be cancelled
        const journeyDate = new Date(booking.journeyDate);
        const departureTime = booking.routeDetails.departureTime;
        const [hours, minutes] = departureTime.split(':');
        journeyDate.setHours(parseInt(hours), parseInt(minutes), 0);

        const now = new Date();
        const hoursUntilDeparture = (journeyDate - now) / (1000 * 60 * 60);

        let refundAmount = booking.totalAmount;
        if (hoursUntilDeparture < 4) {
            // Late cancellation - 50% refund
            refundAmount = booking.totalAmount * 0.5;
        } else if (hoursUntilDeparture < 24) {
            // 75% refund
            refundAmount = booking.totalAmount * 0.75;
        }

        booking.status = 'cancelled';
        booking.paymentStatus = 'refunded';
        booking.cancellationDetails = {
            cancelledAt: new Date(),
            refundAmount: refundAmount,
            reason: reason || 'Cancelled by user'
        };

        await booking.save();

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: {
                refundAmount: refundAmount,
                booking: booking
            }
        });

    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
});

// ==================== ADMIN BOOKING ENDPOINTS ====================

// Get all bookings (admin only)
router.get('/admin/bookings', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, fromDate, toDate, busId } = req.query;
        let query = {};

        if (status) query.status = status;
        if (busId) query.busId = busId;
        
        if (fromDate || toDate) {
            query.journeyDate = {};
            if (fromDate) query.journeyDate.$gte = new Date(fromDate);
            if (toDate) query.journeyDate.$lte = new Date(toDate);
        }

        const bookings = await Booking.find(query)
            .populate('userId', 'firstName lastName email phone')
            .populate('busId', 'busNumber busName')
            .sort({ createdAt: -1 });

        // Calculate statistics
        const totalRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

        res.json({
            success: true,
            count: bookings.length,
            statistics: {
                totalRevenue,
                confirmedBookings,
                cancelledBookings,
                averageBookingValue: bookings.length ? totalRevenue / bookings.length : 0
            },
            data: bookings
        });

    } catch (error) {
        console.error('Get all bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// Get bookings for specific bus (admin only)
router.get('/admin/bookings/bus/:busId', verifyToken, isAdmin, async (req, res) => {
    try {
        const { date } = req.query;
        let query = { busId: req.params.busId, status: 'confirmed' };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.journeyDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const bookings = await Booking.find(query)
            .populate('userId', 'firstName lastName email phone');

        // Get all booked seats
        const bookedSeats = bookings.flatMap(b => 
            b.seats.map(s => ({
                seatNumber: s.seatNumber,
                passengerName: s.passengerName,
                bookingId: b.bookingId,
                status: b.status
            }))
        );

        res.json({
            success: true,
            totalBookings: bookings.length,
            totalPassengers: bookings.reduce((sum, b) => sum + b.seats.length, 0),
            bookedSeats: bookedSeats,
            data: bookings
        });

    } catch (error) {
        console.error('Get bus bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus bookings',
            error: error.message
        });
    }
});

// Update booking status (admin only)
router.patch('/admin/bookings/:id/status', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.status = status;
        await booking.save();

        res.json({
            success: true,
            message: 'Booking status updated successfully',
            data: booking
        });

    } catch (error) {
        console.error('Update booking status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
            error: error.message
        });
    }
});

// Get booking statistics (admin only)
router.get('/admin/statistics', verifyToken, isAdmin, async (req, res) => {
    try {
        const { period } = req.query; // daily, weekly, monthly, yearly
        
        const now = new Date();
        let startDate = new Date();

        switch(period) {
            case 'daily':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'weekly':
                startDate.setDate(now.getDate() - 90);
                break;
            case 'monthly':
                startDate.setMonth(now.getMonth() - 12);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        const bookings = await Booking.find({
            createdAt: { $gte: startDate }
        });

        // Group by date
        const groupedData = {};
        bookings.forEach(booking => {
            const date = booking.createdAt.toISOString().split('T')[0];
            if (!groupedData[date]) {
                groupedData[date] = {
                    date,
                    bookings: 0,
                    revenue: 0,
                    passengers: 0
                };
            }
            groupedData[date].bookings += 1;
            groupedData[date].revenue += booking.totalAmount;
            groupedData[date].passengers += booking.seats.length;
        });

        const chartData = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            success: true,
            data: chartData
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Get booked seats for a bus (public)
router.get('/buses/:busId/booked-seats', async (req, res) => {
    try {
        const { date } = req.query;
        const { busId } = req.params;
        
        let query = { 
            busId: busId, 
            status: { $in: ['confirmed', 'pending'] } 
        };

        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            
            query.journeyDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const bookings = await Booking.find(query);

        const bookedSeats = bookings.flatMap(b => 
            b.seats.map(s => ({
                seatNumber: s.seatNumber,
                passengerName: s.passengerName,
                bookingId: b.bookingId
            }))
        );

        res.json({
            success: true,
            data: bookedSeats
        });

    } catch (error) {
        console.error('Get booked seats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booked seats',
            error: error.message
        });
    }
});

module.exports = router;