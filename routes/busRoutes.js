const express = require('express');
const router = express.Router();
const Bus = require('../models/busModel');
const Route = require('../models/routesModel');
const Fare = require('../models/fareModel');
const User = require('../models/userModel');
const { verifyToken, isAdmin } = require('../middleware');

// ==================== PUBLIC ENDPOINTS (No Auth Required) ====================

// Search buses by route (public)
router.get('/buses/search', async (req, res) => {
    try {
        const { from, to, date, passengers } = req.query;
        
        console.log(`🔍 Searching buses from ${from} to ${to} on ${date}`);

        if (!from || !to) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both origin and destination'
            });
        }

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

        const buses = await Bus.find({ 
            routeId: { $in: routeIds },
            status: 'active'
        }).populate('routeId', 'routeName origin destination distance');

        const formattedBuses = buses.map(bus => {
            const hours = Math.floor(bus.routeId.distance / 50);
            const minutes = Math.floor((bus.routeId.distance % 50) * 60 / 50);
            const duration = `${hours}h ${minutes}m`;
            
            const availableSeats = Math.floor(Math.random() * bus.totalSeats) + 1;
            const rating = (Math.random() * 2 + 3).toFixed(1);

            return {
                _id: bus._id,
                busNumber: bus.busNumber,
                busName: bus.busName,
                busType: bus.busType,
                operator: bus.busName?.split(' ')[0] || 'Travels',
                route: `${bus.routeId.origin}-${bus.routeId.destination}`,
                origin: bus.routeId.origin,
                destination: bus.routeId.destination,
                departureTime: bus.departureTime || '08:00',
                arrivalTime: bus.arrivalTime || '20:00',
                duration: duration,
                price: bus.fare,
                fare: bus.fare,
                availableSeats: availableSeats,
                totalSeats: bus.totalSeats,
                rating: parseFloat(rating),
                amenities: bus.amenities,
                status: 'active'
            };
        });

        res.json({
            success: true,
            count: formattedBuses.length,
            data: formattedBuses,
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

// Get single bus by ID for public users (NO AUTH REQUIRED)
router.get('/buses/public/:id', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id)
            .populate('routeId', 'routeName origin destination distance');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        // Only return public information (no driver details)
        const hours = Math.floor(bus.routeId.distance / 50);
        const minutes = Math.floor((bus.routeId.distance % 50) * 60 / 50);
        const duration = `${hours}h ${minutes}m`;

        // Generate seats (this would come from your seat layout logic)
        const seats = generateSeats(bus.totalSeats, bus.seatLayout);

        res.json({
            success: true,
            data: {
                _id: bus._id,
                busNumber: bus.busNumber,
                busName: bus.busName,
                busType: bus.busType,
                operator: bus.busName?.split(' ')[0] || 'Travels',
                route: `${bus.routeId.origin}-${bus.routeId.destination}`,
                origin: bus.routeId.origin,
                destination: bus.routeId.destination,
                departureTime: bus.departureTime || '08:00',
                arrivalTime: bus.arrivalTime || '20:00',
                duration: duration,
                fare: bus.fare,
                totalSeats: bus.totalSeats,
                amenities: bus.amenities,
                seatLayout: bus.seatLayout,
                seats: seats
            }
        });

    } catch (error) {
        console.error('Get bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus',
            error: error.message
        });
    }
});

// Get popular routes (public)
router.get('/popular-routes', async (req, res) => {
    try {
        const routes = await Route.find({ status: 'active' })
            .limit(6)
            .select('origin destination');

        const popularRoutes = routes.map(route => 
            `${route.origin}-${route.destination}`
        );

        res.json({
            success: true,
            data: popularRoutes
        });

    } catch (error) {
        console.error('Get popular routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching popular routes',
            error: error.message
        });
    }
});

// Get all operators (public)
router.get('/operators', async (req, res) => {
    try {
        const buses = await Bus.find({ status: 'active' }).select('busName');
        const operators = [...new Set(buses.map(bus => bus.busName?.split(' ')[0] || 'Travels'))];
        
        res.json({
            success: true,
            data: operators
        });

    } catch (error) {
        console.error('Get operators error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching operators',
            error: error.message
        });
    }
});

// ==================== ADMIN ENDPOINTS (Auth Required) ====================

// Get all buses (admin only)
router.get('/buses', verifyToken, isAdmin, async (req, res) => {
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
            .populate('routeId', 'routeName origin destination distance')
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
            status: bus.status,
            createdAt: bus.createdAt
        }));

        res.json({
            success: true,
            count: formattedBuses.length,
            data: formattedBuses
        });

    } catch (error) {
        console.error('Get buses error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buses',
            error: error.message
        });
    }
});

// Get single bus by ID (admin only - with full details)
router.get('/buses/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id)
            .populate('routeId', 'routeName origin destination distance');

        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        res.json({
            success: true,
            data: {
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
                status: bus.status
            }
        });

    } catch (error) {
        console.error('Get bus error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bus',
            error: error.message
        });
    }
});

// Get fare for bus type and route (admin only)
router.get('/bus-fare/:routeId/:busType', verifyToken, isAdmin, async (req, res) => {
    try {
        const { routeId, busType } = req.params;
        
        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const fareRecord = await Fare.findOne({ 
            routeId: routeId, 
            busType: busType,
            status: 'active'
        });
        
        if (fareRecord) {
            return res.json({
                success: true,
                data: {
                    fare: fareRecord.baseFare,
                    routeName: route.routeName,
                    source: 'fare_declaration',
                    effectiveFrom: fareRecord.effectiveFrom,
                    effectiveTo: fareRecord.effectiveTo
                }
            });
        }

        let baseRate = 0;
        switch(busType) {
            case 'AC Sleeper': baseRate = 2.5; break;
            case 'AC Seater': baseRate = 2.0; break;
            case 'Non-AC Sleeper': baseRate = 1.5; break;
            case 'Non-AC Seater': baseRate = 1.2; break;
            case 'Luxury': baseRate = 3.0; break;
            case 'Volvo': baseRate = 2.8; break;
            default: baseRate = 1.5;
        }

        const calculatedFare = Math.round(route.distance * baseRate);

        res.json({
            success: true,
            data: {
                fare: calculatedFare,
                routeName: route.routeName,
                source: 'calculated',
                distance: route.distance,
                rate: baseRate
            }
        });

    } catch (error) {
        console.error('Get fare error:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating fare',
            error: error.message
        });
    }
});

// Create new bus (admin only)
router.post('/buses', verifyToken, isAdmin, async (req, res) => {
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
            status
        } = req.body;

        const existingBus = await Bus.findOne({ busNumber: busNumber?.toUpperCase() });
        if (existingBus) {
            return res.status(400).json({
                success: false,
                message: 'Bus with this number already exists'
            });
        }

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
            departureTime: departureTime || '08:00',
            arrivalTime: arrivalTime || '20:00',
            status: status || 'active',
            createdBy: user._id
        });

        await bus.save();
        await bus.populate('routeId', 'routeName origin destination');

        res.status(201).json({
            success: true,
            message: 'Bus created successfully',
            data: bus
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

// Update bus (admin only)
router.put('/buses/:id', verifyToken, isAdmin, async (req, res) => {
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
            status
        } = req.body;

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

// Delete bus (admin only)
router.delete('/buses/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
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

// Toggle bus status (admin only)
router.patch('/buses/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
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
// Get boarding points for a bus
router.get('/buses/:id/boarding-points', async (req, res) => {
  try {
    const boardingPoints = await BoardingPoint.find({ 
      busId: req.params.id,
      isActive: true 
    }).sort({ time: 1 });
    
    res.json({
      success: true,
      data: boardingPoints
    });
  } catch (error) {
    console.error('Error fetching boarding points:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching boarding points'
    });
  }
});
// Get boarding points for a bus (public) - FIXED VERSION
// Get boarding points for a bus (public) - Add this after your other routes
router.get('/buses/:id/boarding-points', async (req, res) => {
    try {
        const BoardingPoint = require('../models/boardingPointModel');
        
        const boardingPoints = await BoardingPoint.find({ 
            busId: req.params.id,
            isActive: true 
        }).sort({ time: 1 });
        
        res.json({
            success: true,
            data: boardingPoints
        });
    } catch (error) {
        console.error('Error fetching boarding points:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching boarding points'
        });
    }
});

// Helper function to generate seats
function generateSeats(totalSeats, layout) {
    const seats = [];
    for (let i = 1; i <= totalSeats; i++) {
        const row = Math.ceil(i / 4);
        const column = ((i - 1) % 4) + 1;
        const isBooked = Math.random() < 0.3;
        
        seats.push({
            number: i.toString(),
            row: row,
            column: column,
            isAvailable: !isBooked,
            isFemale: false,
            price: 0
        });
    }
    return seats;
}

module.exports = router;
