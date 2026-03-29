const express = require('express');
const router = express.Router();
const Route = require('../models/routesModel');
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

// ==================== ADMIN ENDPOINTS ====================

// Get all routes (admin only)
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

// Get single route by ID (admin only)
router.get('/admin/routes/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.json({
            success: true,
            data: route
        });

    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching route',
            error: error.message
        });
    }
});

// Create new route (admin only)
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

        // Sort stops by order if provided
        let sortedStops = [];
        if (stops && stops.length > 0) {
            sortedStops = stops.sort((a, b) => a.order - b.order);
        }

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

// Update route (admin only)
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

        // Sort stops by order if provided
        let sortedStops = [];
        if (stops && stops.length > 0) {
            sortedStops = stops.sort((a, b) => a.order - b.order);
        }

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

// Delete route (admin only)
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
        const Bus = require('../models/busModel');
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

// ==================== STOPS MANAGEMENT ====================

// GET route stops (public - no auth required)
router.get('/routes/:id/stops', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id).select('stops routeName origin destination');

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        res.json({
            success: true,
            data: {
                routeName: route.routeName,
                origin: route.origin,
                destination: route.destination,
                stops: route.stops || []
            }
        });

    } catch (error) {
        console.error('Get route stops error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching route stops',
            error: error.message
        });
    }
});

// UPDATE route stops (admin only)
router.put('/routes/:id/stops', verifyToken, isAdmin, async (req, res) => {
    try {
        const { stops } = req.body;

        if (!Array.isArray(stops)) {
            return res.status(400).json({
                success: false,
                message: 'Stops must be an array'
            });
        }

        // Validate stops
        for (const stop of stops) {
            if (!stop.name || !stop.arrivalTime || !stop.departureTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Each stop must have name, arrivalTime, and departureTime'
                });
            }
        }

        // Sort stops by order
        const sortedStops = stops.sort((a, b) => a.order - b.order);

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            { stops: sortedStops },
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
            message: 'Stops updated successfully',
            data: route.stops
        });

    } catch (error) {
        console.error('Update stops error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating stops',
            error: error.message
        });
    }
});

// ADD a single stop to route (admin only)
router.post('/routes/:id/stops', verifyToken, isAdmin, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const newStop = {
            ...req.body,
            order: route.stops ? route.stops.length : 0
        };

        route.stops.push(newStop);
        await route.save();

        res.status(201).json({
            success: true,
            message: 'Stop added successfully',
            data: newStop
        });

    } catch (error) {
        console.error('Add stop error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding stop',
            error: error.message
        });
    }
});

// UPDATE a single stop (admin only)
router.put('/routes/:routeId/stops/:stopId', verifyToken, isAdmin, async (req, res) => {
    try {
        const route = await Route.findById(req.params.routeId);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const stopIndex = route.stops.findIndex(
            stop => stop._id.toString() === req.params.stopId
        );

        if (stopIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Stop not found'
            });
        }

        // Update stop
        route.stops[stopIndex] = {
            ...route.stops[stopIndex].toObject(),
            ...req.body
        };

        await route.save();

        res.json({
            success: true,
            message: 'Stop updated successfully',
            data: route.stops[stopIndex]
        });

    } catch (error) {
        console.error('Update stop error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating stop',
            error: error.message
        });
    }
});

// DELETE a single stop (admin only)
router.delete('/routes/:routeId/stops/:stopId', verifyToken, isAdmin, async (req, res) => {
    try {
        const route = await Route.findById(req.params.routeId);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const stopIndex = route.stops.findIndex(
            stop => stop._id.toString() === req.params.stopId
        );

        if (stopIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Stop not found'
            });
        }

        // Remove stop
        route.stops.splice(stopIndex, 1);

        // Reorder remaining stops
        route.stops.forEach((stop, index) => {
            stop.order = index;
        });

        await route.save();

        res.json({
            success: true,
            message: 'Stop deleted successfully'
        });

    } catch (error) {
        console.error('Delete stop error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting stop',
            error: error.message
        });
    }
});

module.exports = router;