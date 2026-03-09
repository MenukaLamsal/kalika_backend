const express = require('express');
const router = express.Router();
const Route = require('../models/routesModel');
const { verifyToken, isAdmin } = require('../middleware'); // Notice the curly braces
const User = require('../models/userModel');

// Get all routes (admin only)
router.get('/routes', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { routeName: { $regex: search, $options: 'i' } },
                { origin: { $regex: search, $options: 'i' } },
                { destination: { $regex: search, $options: 'i' } }
            ];
        }

        const routes = await Route.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'firstName lastName email');

        res.json({
            success: true,
            count: routes.length,
            data: routes
        });

    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message
        });
    }
});

// Get single route by ID (admin only)
router.get('/routes/:id', verifyToken, isAdmin, async (req, res) => {
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
router.post('/routes', verifyToken, isAdmin, async (req, res) => {
    try {
        const { routeName, origin, destination, distance, duration, stops, status } = req.body;

        const existingRoute = await Route.findOne({ routeName });
        if (existingRoute) {
            return res.status(400).json({
                success: false,
                message: 'Route with this name already exists'
            });
        }

        const user = await User.findOne({ email: req.user.email });

        const route = new Route({
            routeName,
            origin,
            destination,
            distance,
            duration,
            stops: stops || [],
            status: status || 'active',
            createdBy: user._id,
            busesAssigned: 0
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
router.put('/routes/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { routeName, origin, destination, distance, duration, status } = req.body;

        if (routeName) {
            const existingRoute = await Route.findOne({ 
                routeName, 
                _id: { $ne: req.params.id } 
            });
            if (existingRoute) {
                return res.status(400).json({
                    success: false,
                    message: 'Route with this name already exists'
                });
            }
        }

        const route = await Route.findByIdAndUpdate(
            req.params.id,
            {
                routeName,
                origin,
                destination,
                distance,
                duration,
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
router.delete('/routes/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        if (route.busesAssigned > 0) {
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

// Toggle route status (admin only)
router.patch('/routes/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        route.status = route.status === 'active' ? 'inactive' : 'active';
        await route.save();

        res.json({
            success: true,
            message: `Route ${route.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: route
        });

    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling route status',
            error: error.message
        });
    }
});

// Get route stops (admin only)
router.get('/routes/:id/stops', verifyToken, isAdmin, async (req, res) => {
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
                stops: route.stops
            }
        });

    } catch (error) {
        console.error('Get stops error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching stops',
            error: error.message
        });
    }
});

// Update route stops (admin only)
router.put('/routes/:id/stops', verifyToken, isAdmin, async (req, res) => {
    try {
        const { stops } = req.body;

        if (!Array.isArray(stops)) {
            return res.status(400).json({
                success: false,
                message: 'Stops must be an array'
            });
        }

        const route = await Route.findById(req.params.id);

        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        route.stops = stops;
        await route.save();

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

module.exports = router;