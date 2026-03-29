const express = require('express');
const router = express.Router();
const Bus = require('../models/busModel');
const Route = require('../models/routesModel');
const Fare = require('../models/fareModel');
const User = require('../models/userModel');
const { verifyToken, isAdmin } = require('../middleware');

// ==================== PUBLIC ENDPOINTS ====================

// Get all active routes for dropdown
router.get('/routes/active', async (req, res) => {
    try {
        const routes = await Route.find({ status: 'active' })
            .select('_id routeName routeCode origin destination distance duration stops')
            .sort({ routeName: 1 });

        const formattedRoutes = routes.map(route => ({
            _id: route._id,
            routeName: route.routeName,
            routeCode: route.routeCode,
            origin: route.origin,
            destination: route.destination,
            distance: route.distance,
            duration: route.duration,
            boardingPoints: route.boardingPoints,
            mealStops: route.mealStops,
            totalStops: route.totalStops
        }));

        res.json({
            success: true,
            count: formattedRoutes.length,
            data: formattedRoutes
        });

    } catch (error) {
        console.error('Get active routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message
        });
    }
});

// Get all active buses
router.get('/buses/active', async (req, res) => {
    try {
        const { routeId, busType, search } = req.query;
        let query = { status: 'active' };

        if (routeId && routeId !== 'all') {
            query.routeId = routeId;
        }
        if (busType && busType !== 'all') {
            query.busType = busType;
        }
        if (search) {
            query.$or = [
                { busName: { $regex: search, $options: 'i' } },
                { busNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const buses = await Bus.find(query)
            .populate('routeId', 'routeName origin destination distance duration stops')
            .sort({ departureDate: 1, departureTime: 1 });

        const formattedBuses = buses.map(bus => ({
            _id: bus._id,
            busNumber: bus.busNumber,
            busName: bus.busName,
            busType: bus.busType,
            operator: bus.operator,
            routeId: bus.routeId._id,
            routeName: bus.routeId.routeName,
            routeCode: bus.routeId.routeCode,
            origin: bus.routeId.origin,
            destination: bus.routeId.destination,
            distance: bus.routeId.distance,
            departureTime: bus.departureTime,
            arrivalTime: bus.arrivalTime,
            departureDate: bus.departureDate,
            arrivalDate: bus.arrivalDate,
            duration: bus.routeId.duration,
            fare: bus.fare,
            totalSeats: bus.totalSeats,
            seatLayout: bus.seatLayout,
            amenities: bus.amenities,
            driverName: bus.driverName,
            driverPhone: bus.driverPhone,
            status: bus.status,
            boardingPoints: bus.routeId.boardingPoints,
            mealStops: bus.routeId.mealStops,
            stops: bus.routeId.stops
        }));

        res.json({
            success: true,
            count: formattedBuses.length,
            data: formattedBuses
        });

    } catch (error) {
        console.error('Get active buses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses',
            error: error.message
        });
    }
});

// Search buses with full details
router.get('/buses/search', async (req, res) => {
    try {
        const { from, to, date, passengers, busType } = req.query;
        
        console.log(`🔍 Searching buses from ${from} to ${to} on ${date}`);

        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both origin and destination'
            });
        }

        // Find routes matching origin and destination
        const routes = await Route.find({
            origin: { $regex: new RegExp(from, 'i') },
            destination: { $regex: new RegExp(to, 'i') },
            status: 'active'
        });

        if (routes.length === 0) {
            return res.json({
                success: true,
                count: 0,
                data: [],
                message: 'No routes found for this destination'
            });
        }

        const routeIds = routes.map(route => route._id);

        // Build bus query
        let busQuery = { 
            routeId: { $in: routeIds },
            status: 'active'
        };

        if (busType && busType !== 'all') {
            busQuery.busType = busType;
        }

        // Parse date
        const searchDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);

        busQuery.departureDate = { $gte: startOfDay, $lte: endOfDay };

        const buses = await Bus.find(busQuery)
            .populate('routeId', 'routeName origin destination distance duration stops')
            .sort({ departureTime: 1 });

        // Get booked seats for each bus
        const Booking = require('../models/bookingModel');
        const bookings = await Booking.find({
            busId: { $in: buses.map(b => b._id) },
            journeyDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['confirmed', 'pending'] }
        });

        const bookedSeatsMap = {};
        bookings.forEach(booking => {
            const busId = booking.busId.toString();
            if (!bookedSeatsMap[busId]) {
                bookedSeatsMap[busId] = [];
            }
            booking.seats.forEach(seat => {
                bookedSeatsMap[busId].push(seat.seatNumber);
            });
        });

        const formattedBuses = await Promise.all(buses.map(async (bus) => {
            const busId = bus._id.toString();
            const bookedSeats = bookedSeatsMap[busId] || [];
            const availableSeats = bus.totalSeats - bookedSeats.length;
            
            // Get fare details
            const fare = await Fare.findOne({
                routeId: bus.routeId._id,
                busType: bus.busType,
                status: 'active'
            });

            const baseFare = fare ? fare.baseFare : bus.fare;
            const perKmRate = fare ? fare.perKmRate : 1.5;
            const calculatedFare = baseFare + (bus.routeId.distance * perKmRate);

            return {
                _id: bus._id,
                busNumber: bus.busNumber,
                busName: bus.busName,
                busType: bus.busType,
                operator: bus.operator,
                routeId: bus.routeId._id,
                routeName: bus.routeId.routeName,
                origin: bus.routeId.origin,
                destination: bus.routeId.destination,
                distance: bus.routeId.distance,
                departureTime: bus.departureTime,
                arrivalTime: bus.arrivalTime,
                departureDate: bus.departureDate,
                duration: bus.routeId.duration,
                fare: Math.round(calculatedFare),
                baseFare: baseFare,
                totalSeats: bus.totalSeats,
                availableSeats: availableSeats,
                seatLayout: bus.seatLayout,
                amenities: bus.amenities,
                driverName: bus.driverName,
                driverPhone: bus.driverPhone,
                boardingPoints: bus.routeId.boardingPoints,
                mealStops: bus.routeId.mealStops,
                stops: bus.routeId.stops,
                bookedSeats: bookedSeats,
                rating: (Math.random() * 2 + 3).toFixed(1) // You can replace with actual ratings
            };
        }));

        // Filter out buses with no available seats if passengers specified
        let filteredBuses = formattedBuses;
        if (passengers) {
            filteredBuses = formattedBuses.filter(bus => bus.availableSeats >= parseInt(passengers));
        }

        res.json({
            success: true,
            count: filteredBuses.length,
            data: filteredBuses,
            from: from,
            to: to,
            date: date || new Date().toISOString().split('T')[0],
            passengers: passengers || 1
        });

    } catch (error) {
        console.error('Search buses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching buses',
            error: error.message
        });
    }
});

// Get bus by ID with full details
router.get('/buses/:id/details', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id)
            .populate('routeId', 'routeName origin destination distance duration stops');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        // Get fare details
        const fare = await Fare.findOne({
            routeId: bus.routeId._id,
            busType: bus.busType,
            status: 'active'
        });

        // Get booked seats for today
        const { date } = req.query;
        const searchDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setHours(23, 59, 59, 999);

        const Booking = require('../models/bookingModel');
        const bookings = await Booking.find({
            busId: bus._id,
            journeyDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['confirmed', 'pending'] }
        });

        const bookedSeats = bookings.flatMap(b => b.seats.map(s => s.seatNumber));

        // Generate seats
        const seats = generateSeats(bus.totalSeats, bus.seatLayout, bookedSeats, fare);

        res.json({
            success: true,
            data: {
                _id: bus._id,
                busNumber: bus.busNumber,
                busName: bus.busName,
                busType: bus.busType,
                operator: bus.operator,
                routeId: bus.routeId._id,
                routeName: bus.routeId.routeName,
                origin: bus.routeId.origin,
                destination: bus.routeId.destination,
                distance: bus.routeId.distance,
                departureTime: bus.departureTime,
                arrivalTime: bus.arrivalTime,
                departureDate: bus.departureDate,
                duration: bus.routeId.duration,
                fare: fare ? fare.baseFare : bus.fare,
                fareDetails: fare,
                totalSeats: bus.totalSeats,
                availableSeats: bus.totalSeats - bookedSeats.length,
                seatLayout: bus.seatLayout,
                amenities: bus.amenities,
                driverName: bus.driverName,
                driverPhone: bus.driverPhone,
                driverLicense: bus.driverLicense,
                boardingPoints: bus.routeId.boardingPoints,
                mealStops: bus.routeId.mealStops,
                stops: bus.routeId.stops,
                seats: seats,
                bookedSeats: bookedSeats,
                status: bus.status
            }
        });

    } catch (error) {
        console.error('Get bus details error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus details',
            error: error.message
        });
    }
});

// ==================== ADMIN ENDPOINTS ====================

// Get all routes with full details
router.get('/admin/routes', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { routeName: { $regex: search, $options: 'i' } },
                { routeCode: { $regex: search, $options: 'i' } },
                { origin: { $regex: search, $options: 'i' } },
                { destination: { $regex: search, $options: 'i' } }
            ];
        }

        const routes = await Route.find(query)
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: routes.length,
            data: routes
        });

    } catch (error) {
        console.error('Get admin routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message
        });
    }
});

// Create new route with stops
router.post('/admin/routes', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            routeName,
            routeCode,
            origin,
            destination,
            distance,
            duration,
            stops,
            status
        } = req.body;

        // Check if route name already exists
        const existingRoute = await Route.findOne({ 
            $or: [
                { routeName },
                { routeCode: routeCode?.toUpperCase() }
            ]
        });

        if (existingRoute) {
            return res.status(400).json({
                success: false,
                message: 'Route with this name or code already exists'
            });
        }

        const user = await User.findOne({ email: req.user.email });

        // Sort stops by order
        const sortedStops = stops.sort((a, b) => a.order - b.order);

        const route = new Route({
            routeName,
            routeCode: routeCode?.toUpperCase(),
            origin,
            destination,
            distance,
            duration,
            stops: sortedStops,
            status: status || 'active',
            createdBy: user._id
        });

        await route.save();

        res.status(201).json({
            success: true,
            message: 'Route created successfully',
            data: route
        });

    } catch (error) {
        console.error('Create route error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating route',
            error: error.message
        });
    }
});

// Update route
router.put('/admin/routes/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            routeName,
            routeCode,
            origin,
            destination,
            distance,
            duration,
            stops,
            status
        } = req.body;

        // Check if route name exists for another route
        const existingRoute = await Route.findOne({
            $or: [
                { routeName, _id: { $ne: req.params.id } },
                { routeCode: routeCode?.toUpperCase(), _id: { $ne: req.params.id } }
            ]
        });

        if (existingRoute) {
            return res.status(400).json({
                success: false,
                message: 'Route with this name or code already exists'
            });
        }

        // Sort stops by order
        const sortedStops = stops.sort((a, b) => a.order - b.order);

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            {
                routeName,
                routeCode: routeCode?.toUpperCase(),
                origin,
                destination,
                distance,
                duration,
                stops: sortedStops,
                status
            },
            { new: true, runValidators: true }
        );

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.json({
            success: true,
            message: 'Route updated successfully',
            data: route
        });

    } catch (error) {
        console.error('Update route error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating route',
            error: error.message
        });
    }
});

// Delete route
router.delete('/admin/routes/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Check if route has buses assigned
        const buses = await Bus.find({ routeId: route._id });
        if (buses.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete route with assigned buses'
            });
        }

        await route.deleteOne();

        res.json({
            success: true,
            message: 'Route deleted successfully'
        });

    } catch (error) {
        console.error('Delete route error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting route',
            error: error.message
        });
    }
});

// Get all buses (admin)
router.get('/admin/buses', verifyToken, isAdmin, async (req, res) => {
    try {
        const { routeId, busType, status, search } = req.query;
        let query = {};

        if (routeId && routeId !== 'all') query.routeId = routeId;
        if (busType && busType !== 'all') query.busType = busType;
        if (status && status !== 'all') query.status = status;
        
        if (search) {
            query.$or = [
                { busNumber: { $regex: search, $options: 'i' } },
                { busName: { $regex: search, $options: 'i' } },
                { driverName: { $regex: search, $options: 'i' } }
            ];
        }

        const buses = await Bus.find(query)
            .populate('routeId', 'routeName origin destination distance duration')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        const formattedBuses = buses.map(bus => ({
            _id: bus._id,
            busNumber: bus.busNumber,
            busName: bus.busName,
            busType: bus.busType,
            routeId: bus.routeId._id,
            routeName: bus.routeId.routeName,
            origin: bus.routeId.origin,
            destination: bus.routeId.destination,
            distance: bus.routeId.distance,
            driverName: bus.driverName,
            driverPhone: bus.driverPhone,
            driverLicense: bus.driverLicense,
            totalSeats: bus.totalSeats,
            seatLayout: bus.seatLayout,
            amenities: bus.amenities,
            fare: bus.fare,
            departureTime: bus.departureTime,
            arrivalTime: bus.arrivalTime,
            departureDate: bus.departureDate,
            arrivalDate: bus.arrivalDate,
            status: bus.status,
            createdAt: bus.createdAt
        }));

        res.json({
            success: true,
            count: formattedBuses.length,
            data: formattedBuses
        });

    } catch (error) {
        console.error('Get admin buses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses',
            error: error.message
        });
    }
});

// Create new bus with all details
router.post('/admin/buses', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            busNumber,
            busName,
            busType,
            routeId,
            driverName,
            driverPhone,
            driverLicense,
            totalSeats,
            seatLayout,
            amenities,
            fare,
            departureTime,
            arrivalTime,
            departureDate,
            arrivalDate,
            status
        } = req.body;

        // Validate dates
        if (new Date(departureDate) >= new Date(arrivalDate)) {
            return res.status(400).json({
                success: false,
                message: 'Arrival date must be after departure date'
            });
        }

        // Check if bus number already exists
        const existingBus = await Bus.findOne({ busNumber: busNumber?.toUpperCase() });
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: 'Bus with this number already exists'
            });
        }

        // Check if route exists
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const user = await User.findOne({ email: req.user.email });

        const bus = new Bus({
            busNumber: busNumber?.toUpperCase(),
            busName,
            busType,
            routeId,
            driverName,
            driverPhone,
            driverLicense,
            totalSeats,
            seatLayout: seatLayout || '2x2',
            amenities: amenities || [],
            fare,
            departureTime,
            arrivalTime,
            departureDate: new Date(departureDate),
            arrivalDate: new Date(arrivalDate),
            status: status || 'active',
            createdBy: user._id
        });

        await bus.save();
        await bus.populate('routeId', 'routeName origin destination');

        res.status(201).json({
            success: true,
            message: 'Bus created successfully',
            data: {
                _id: bus._id,
                busNumber: bus.busNumber,
                busName: bus.busName,
                busType: bus.busType,
                routeId: bus.routeId._id,
                routeName: bus.routeId.routeName,
                origin: bus.routeId.origin,
                destination: bus.routeId.destination,
                driverName: bus.driverName,
                driverPhone: bus.driverPhone,
                driverLicense: bus.driverLicense,
                totalSeats: bus.totalSeats,
                seatLayout: bus.seatLayout,
                amenities: bus.amenities,
                fare: bus.fare,
                departureTime: bus.departureTime,
                arrivalTime: bus.arrivalTime,
                departureDate: bus.departureDate,
                arrivalDate: bus.arrivalDate,
                status: bus.status
            }
        });

    } catch (error) {
        console.error('Create bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating bus',
            error: error.message
        });
    }
});

// Update bus
router.put('/admin/buses/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            busNumber,
            busName,
            busType,
            routeId,
            driverName,
            driverPhone,
            driverLicense,
            totalSeats,
            seatLayout,
            amenities,
            fare,
            departureTime,
            arrivalTime,
            departureDate,
            arrivalDate,
            status
        } = req.body;

        // Validate dates if both provided
        if (departureDate && arrivalDate && new Date(departureDate) >= new Date(arrivalDate)) {
            return res.status(400).json({
                success: false,
                message: 'Arrival date must be after departure date'
            });
        }

        // Check if bus number exists for another bus
        if (busNumber) {
            const existingBus = await Bus.findOne({ 
                busNumber: busNumber?.toUpperCase(),
                _id: { $ne: req.params.id }
            });
            if (existingBus) {
                return res.status(400).json({
                    success: false,
                    message: 'Bus with this number already exists'
                });
            }
        }

        // Check if route exists
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const bus = await Bus.findByIdAndUpdate(
            req.params.id,
            {
                busNumber: busNumber?.toUpperCase(),
                busName,
                busType,
                routeId,
                driverName,
                driverPhone,
                driverLicense,
                totalSeats,
                seatLayout,
                amenities,
                fare,
                departureTime,
                arrivalTime,
                departureDate: departureDate ? new Date(departureDate) : undefined,
                arrivalDate: arrivalDate ? new Date(arrivalDate) : undefined,
                status
            },
            { new: true, runValidators: true }
        ).populate('routeId', 'routeName origin destination');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.json({
            success: true,
            message: 'Bus updated successfully',
            data: bus
        });

    } catch (error) {
        console.error('Update bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating bus',
            error: error.message
        });
    }
});

// Delete bus
router.delete('/admin/buses/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        // Check if bus has any bookings
        const Booking = require('../models/bookingModel');
        const hasBookings = await Booking.findOne({ busId: bus._id });
        if (hasBookings) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete bus with existing bookings'
            });
        }

        await bus.deleteOne();

        res.json({
            success: true,
            message: 'Bus deleted successfully'
        });

    } catch (error) {
        console.error('Delete bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting bus',
            error: error.message
        });
    }
});

// Toggle bus status
router.patch('/admin/buses/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        bus.status = bus.status === 'active' ? 'inactive' : 'active';
        await bus.save();

        res.json({
            success: true,
            message: `Bus ${bus.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: { status: bus.status }
        });

    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling bus status',
            error: error.message
        });
    }
});

// ==================== FARE MANAGEMENT ====================

// Get all fares
router.get('/admin/fares', verifyToken, isAdmin, async (req, res) => {
    try {
        const { routeId, busType, status } = req.query;
        let query = {};

        if (routeId && routeId !== 'all') query.routeId = routeId;
        if (busType && busType !== 'all') query.busType = busType;
        if (status && status !== 'all') query.status = status;

        const fares = await Fare.find(query)
            .populate('routeId', 'routeName origin destination distance')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: fares.length,
            data: fares
        });

    } catch (error) {
        console.error('Get fares error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching fares',
            error: error.message
        });
    }
});

// Create fare
router.post('/admin/fares', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            routeId,
            busType,
            baseFare,
            perKmRate,
            minimumFare,
            discountPercent,
            taxPercent,
            serviceCharge,
            seatFare,
            effectiveFrom,
            effectiveTo,
            status
        } = req.body;

        // Check if route exists
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        // Check if fare already exists
        const existingFare = await Fare.findOne({ routeId, busType });
        if (existingFare) {
            return res.status(400).json({
                success: false,
                message: `Fare already exists for ${route.routeName} with ${busType} bus type`
            });
        }

        const user = await User.findOne({ email: req.user.email });

        const fare = new Fare({
            routeId,
            busType,
            baseFare,
            perKmRate,
            minimumFare,
            discountPercent: discountPercent || 0,
            taxPercent: taxPercent || 18,
            serviceCharge: serviceCharge || 0,
            seatFare: seatFare || {},
            effectiveFrom: new Date(effectiveFrom),
            effectiveTo: new Date(effectiveTo),
            status: status || 'active',
            createdBy: user._id
        });

        await fare.save();
        await fare.populate('routeId', 'routeName origin destination');

        res.status(201).json({
            success: true,
            message: 'Fare created successfully',
            data: fare
        });

    } catch (error) {
        console.error('Create fare error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating fare',
            error: error.message
        });
    }
});

// Update fare
router.put('/admin/fares/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            busType,
            baseFare,
            perKmRate,
            minimumFare,
            discountPercent,
            taxPercent,
            serviceCharge,
            seatFare,
            effectiveFrom,
            effectiveTo,
            status
        } = req.body;

        const fare = await Fare.findByIdAndUpdate(
            req.params.id,
            {
                busType,
                baseFare,
                perKmRate,
                minimumFare,
                discountPercent,
                taxPercent,
                serviceCharge,
                seatFare,
                effectiveFrom: new Date(effectiveFrom),
                effectiveTo: new Date(effectiveTo),
                status
            },
            { new: true, runValidators: true }
        ).populate('routeId', 'routeName origin destination');

        if (!fare) {
            return res.status(404).json({
                success: false,
                message: 'Fare not found'
            });
        }

        res.json({
            success: true,
            message: 'Fare updated successfully',
            data: fare
        });

    } catch (error) {
        console.error('Update fare error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating fare',
            error: error.message
        });
    }
});

// Delete fare
router.delete('/admin/fares/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const fare = await Fare.findById(req.params.id);
        if (!fare) {
            return res.status(404).json({
                success: false,
                message: 'Fare not found'
            });
        }
        await fare.deleteOne();
        res.json({
            success: true,
            message: 'Fare deleted successfully'
        });
    } catch (error) {
        console.error('Delete fare error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting fare',
            error: error.message
        });
    }
});

// Toggle fare status
router.patch('/admin/fares/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const fare = await Fare.findById(req.params.id);
        if (!fare) {
            return res.status(404).json({
                success: false,
                message: 'Fare not found'
            });
        }
        fare.status = fare.status === 'active' ? 'inactive' : 'active';
        await fare.save();
        res.json({
            success: true,
            message: `Fare ${fare.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: { status: fare.status }
        });
    } catch (error) {
        console.error('Toggle fare status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling fare status',
            error: error.message
        });
    }
});

// Helper function to generate seats
function generateSeats(totalSeats, layout, bookedSeats = [], fare = null) {
    const seats = [];
    const seatsPerRow = 4; // A, B, C, D
    
    for (let i = 1; i <= totalSeats; i++) {
        const row = Math.ceil(i / seatsPerRow);
        const columnIndex = (i - 1) % seatsPerRow;
        const columns = ['A', 'B', 'C', 'D'];
        const column = columns[columnIndex];
        const seatNumber = `${row}${column}`;
        
        // Determine seat type based on layout
        let seatType = 'standard';
        let seatPrice = fare ? fare.baseFare : 0;
        
        // Apply seat specific fare if available
        if (fare && fare.seatFare && fare.seatFare[seatNumber]) {
            seatPrice = fare.seatFare[seatNumber];
        } else if (fare) {
            // Calculate based on position
            if (column === 'A' || column === 'D') {
                seatPrice = fare.baseFare * 1.1; // Window seats 10% premium
            } else if (column === 'B') {
                seatPrice = fare.baseFare * 0.95; // Middle seats 5% discount
            }
        }
        
        // Determine if ladies seat (e.g., even rows, column B and D)
        const isLadies = (row % 2 === 0) && (column === 'B' || column === 'D');
        
        seats.push({
            id: i,
            number: seatNumber,
            row: row,
            column: column,
            price: Math.round(seatPrice),
            status: bookedSeats.includes(seatNumber) ? 'booked' : (isLadies ? 'ladies' : 'available'),
            isLadies: isLadies,
            type: seatType,
            tempSelected: false
        });
    }
    
    return seats;
}

module.exports = router;