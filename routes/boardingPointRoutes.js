const express = require('express');
const router = express.Router();
const BoardingPoint = require('../models/boardingPointModel');
const Bus = require('../models/busModel');
const User = require('../models/userModel');
const { verifyToken, isAdmin } = require('../middleware');

// ==================== ADMIN ENDPOINTS ====================

// Create boarding point for a bus (admin only)
router.post('/buses/:busId/boarding-points', verifyToken, isAdmin, async (req, res) => {
    try {
        const { busId } = req.params;
        const { name, address, time, contact, landmark, city, fare, order } = req.body;

        // Check if bus exists
        const bus = await Bus.findById(busId);
        if (!bus) {
            return res.status(404).json({
                success: false,
                message: 'Bus not found'
            });
        }

        // Get user
        const user = await User.findOne({ email: req.user.email });

        // Create boarding point
        const boardingPoint = new BoardingPoint({
            busId,
            name,
            address,
            time,
            contact,
            landmark,
            city,
            fare: fare || 0,
            order: order || 0,
            createdBy: user._id
        });

        await boardingPoint.save();

        // Add boarding point reference to bus
        await Bus.findByIdAndUpdate(busId, {
            $push: { boardingPoints: boardingPoint._id }
        });

        res.status(201).json({
            success: true,
            message: 'Boarding point created successfully',
            data: boardingPoint
        });

    } catch (error) {
        console.error('Create boarding point error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating boarding point',
            error: error.message
        });
    }
});

// Get all boarding points for a bus (admin)
router.get('/buses/:busId/boarding-points', verifyToken, isAdmin, async (req, res) => {
    try {
        const { busId } = req.params;
        
        const boardingPoints = await BoardingPoint.find({ busId, isActive: true })
            .sort({ order: 1, time: 1 });

        res.json({
            success: true,
            count: boardingPoints.length,
            data: boardingPoints
        });

    } catch (error) {
        console.error('Get boarding points error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching boarding points',
            error: error.message
        });
    }
});

// Get single boarding point by ID (admin)
router.get('/boarding-points/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const boardingPoint = await BoardingPoint.findById(req.params.id);

        if (!boardingPoint) {
            return res.status(404).json({
                success: false,
                message: 'Boarding point not found'
            });
        }

        res.json({
            success: true,
            data: boardingPoint
        });

    } catch (error) {
        console.error('Get boarding point error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching boarding point',
            error: error.message
        });
    }
});

// Update boarding point (admin only)
router.put('/boarding-points/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const boardingPoint = await BoardingPoint.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!boardingPoint) {
            return res.status(404).json({
                success: false,
                message: 'Boarding point not found'
            });
        }

        res.json({
            success: true,
            message: 'Boarding point updated successfully',
            data: boardingPoint
        });

    } catch (error) {
        console.error('Update boarding point error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating boarding point',
            error: error.message
        });
    }
});

// Delete boarding point (admin only)
router.delete('/boarding-points/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const boardingPoint = await BoardingPoint.findById(id);
        if (!boardingPoint) {
            return res.status(404).json({
                success: false,
                message: 'Boarding point not found'
            });
        }

        // Remove from bus
        await Bus.findByIdAndUpdate(boardingPoint.busId, {
            $pull: { boardingPoints: id }
        });

        await boardingPoint.deleteOne();

        res.json({
            success: true,
            message: 'Boarding point deleted successfully'
        });

    } catch (error) {
        console.error('Delete boarding point error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting boarding point',
            error: error.message
        });
    }
});

// Toggle boarding point status (admin only)
router.patch('/boarding-points/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const boardingPoint = await BoardingPoint.findById(req.params.id);

        if (!boardingPoint) {
            return res.status(404).json({
                success: false,
                message: 'Boarding point not found'
            });
        }

        boardingPoint.isActive = !boardingPoint.isActive;
        await boardingPoint.save();

        res.json({
            success: true,
            message: `Boarding point ${boardingPoint.isActive ? 'activated' : 'deactivated'} successfully`,
            data: boardingPoint
        });

    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling boarding point status',
            error: error.message
        });
    }
});

// ==================== PUBLIC ENDPOINTS ====================

// Get boarding points for a bus (public)
router.get('/buses/:busId/boarding-points/public', async (req, res) => {
    try {
        const { busId } = req.params;
        
        const boardingPoints = await BoardingPoint.find({ 
            busId, 
            isActive: true 
        }).sort({ order: 1, time: 1 });

        res.json({
            success: true,
            data: boardingPoints
        });

    } catch (error) {
        console.error('Get public boarding points error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching boarding points'
        });
    }
});

module.exports = router;