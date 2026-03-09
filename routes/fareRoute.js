const express = require('express');
const router = express.Router();
const Fare = require('../models/fareModel');
const Route = require('../models/routesModel');
const User = require('../models/userModel');
const { verifyToken, isAdmin } = require('../middleware');

// Get all routes for dropdown (admin only)
router.get('/routes-list', verifyToken, isAdmin, async (req, res) => {
    try {
        const routes = await Route.find({ status: 'active' })
            .select('_id routeName origin destination distance')
            .sort({ routeName: 1 });

        res.json({
            success: true,
            data: routes
        });
    } catch (error) {
        console.error('Get routes list error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching routes',
            error: error.message
        });
    }
});

// Get all fares (admin only)
router.get('/fares', verifyToken, isAdmin, async (req, res) => {
    try {
        const { routeId, busType, status, search } = req.query;
        let query = {};

        if (routeId && routeId !== 'all') {
            query.routeId = routeId;
        }
        if (busType && busType !== 'all') {
            query.busType = busType;
        }
        if (status && status !== 'all') {
            query.status = status;
        }

        const fares = await Fare.find(query)
            .populate('routeId', 'routeName origin destination distance')
            .populate('createdBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        const formattedFares = fares.map(fare => ({
            _id: fare._id,
            routeId: fare.routeId._id,
            routeName: fare.routeId.routeName,
            origin: fare.routeId.origin,
            destination: fare.routeId.destination,
            distance: fare.routeId.distance,
            busType: fare.busType,
            baseFare: fare.baseFare,
            seatCapacity: fare.seatCapacity,
            effectiveFrom: fare.effectiveFrom,
            effectiveTo: fare.effectiveTo,
            status: fare.status,
            createdBy: fare.createdBy,
            createdAt: fare.createdAt
        }));

        res.json({
            success: true,
            count: formattedFares.length,
            data: formattedFares
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

// Get single fare by ID (admin only)
router.get('/fares/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const fare = await Fare.findById(req.params.id)
            .populate('routeId', 'routeName origin destination distance');

        if (!fare) {
            return res.status(404).json({
                success: false,
                message: 'Fare not found'
            });
        }

        res.json({
            success: true,
            data: {
                _id: fare._id,
                routeId: fare.routeId._id,
                routeName: fare.routeId.routeName,
                origin: fare.routeId.origin,
                destination: fare.routeId.destination,
                distance: fare.routeId.distance,
                busType: fare.busType,
                baseFare: fare.baseFare,
                seatCapacity: fare.seatCapacity,
                effectiveFrom: fare.effectiveFrom,
                effectiveTo: fare.effectiveTo,
                status: fare.status
            }
        });

    } catch (error) {
        console.error('Get fare error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching fare',
            error: error.message
        });
    }
});

// Create new fare (admin only)
router.post('/fares', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            routeId,
            busType,
            baseFare,
            seatCapacity,
            effectiveFrom,
            effectiveTo,
            status
        } = req.body;

        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const existingFare = await Fare.findOne({ routeId, busType });
        if (existingFare) {
            return res.status(400).json({
                success: false,
                message: `Fare already exists for ${route.routeName} with ${busType} bus type`
            });
        }

        const user = await User.findOne({ email: req.user.email });

        // Calculate deck distribution
        const totalSeats = seatCapacity?.totalSeats || 40;
        const lowerDeckSeats = Math.ceil(totalSeats / 2);
        const upperDeckSeats = Math.floor(totalSeats / 2);

        const fare = new Fare({
            routeId,
            busType,
            baseFare,
            seatCapacity: {
                totalSeats: totalSeats,
                seatLayout: seatCapacity?.seatLayout || '2x2',
                lowerDeckSeats: lowerDeckSeats,
                upperDeckSeats: upperDeckSeats
            },
            effectiveFrom: new Date(effectiveFrom),
            effectiveTo: new Date(effectiveTo),
            status: status || 'active',
            createdBy: user._id
        });

        await fare.save();
        await fare.populate('routeId', 'routeName origin destination distance');

        res.status(201).json({
            success: true,
            message: 'Fare created successfully',
            data: {
                _id: fare._id,
                routeId: fare.routeId._id,
                routeName: fare.routeId.routeName,
                origin: fare.routeId.origin,
                destination: fare.routeId.destination,
                distance: fare.routeId.distance,
                busType: fare.busType,
                baseFare: fare.baseFare,
                seatCapacity: fare.seatCapacity,
                effectiveFrom: fare.effectiveFrom,
                effectiveTo: fare.effectiveTo,
                status: fare.status
            }
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

// Update fare (admin only)
router.put('/fares/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const {
            routeId,
            busType,
            baseFare,
            seatCapacity,
            effectiveFrom,
            effectiveTo,
            status
        } = req.body;

        const route = await Route.findById(routeId);
        if (!route) {
            return res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        }

        const existingFare = await Fare.findOne({ 
            routeId, 
            busType,
            _id: { $ne: req.params.id }
        });
        
        if (existingFare) {
            return res.status(400).json({
                success: false,
                message: `Another fare already exists for ${route.routeName} with ${busType} bus type`
            });
        }

        // Calculate deck distribution if totalSeats changed
        let updatedSeatCapacity = seatCapacity;
        if (seatCapacity?.totalSeats) {
            const totalSeats = seatCapacity.totalSeats;
            updatedSeatCapacity = {
                ...seatCapacity,
                lowerDeckSeats: Math.ceil(totalSeats / 2),
                upperDeckSeats: Math.floor(totalSeats / 2)
            };
        }

        const fare = await Fare.findByIdAndUpdate(
            req.params.id,
            {
                routeId,
                busType,
                baseFare,
                seatCapacity: updatedSeatCapacity,
                effectiveFrom: new Date(effectiveFrom),
                effectiveTo: new Date(effectiveTo),
                status
            },
            { new: true, runValidators: true }
        ).populate('routeId', 'routeName origin destination distance');

        if (!fare) {
            return res.status(404).json({
                success: false,
                message: 'Fare not found'
            });
        }

        res.json({
            success: true,
            message: 'Fare updated successfully',
            data: {
                _id: fare._id,
                routeId: fare.routeId._id,
                routeName: fare.routeId.routeName,
                origin: fare.routeId.origin,
                destination: fare.routeId.destination,
                distance: fare.routeId.distance,
                busType: fare.busType,
                baseFare: fare.baseFare,
                seatCapacity: fare.seatCapacity,
                effectiveFrom: fare.effectiveFrom,
                effectiveTo: fare.effectiveTo,
                status: fare.status
            }
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

// Delete fare (admin only)
router.delete('/fares/:id', verifyToken, isAdmin, async (req, res) => {
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

// Toggle fare status (admin only)
router.patch('/fares/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
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
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling fare status',
            error: error.message
        });
    }
});

module.exports = router;