// // const express = require("express");
// // const router = express.Router();
// // const User = require('../models/userModel');
// // const bcrypt = require('bcrypt');
// // const jwt = require('jsonwebtoken');
// // const verifyToken = require('../middleware');
// // const { verifyToken, isAdmin } = require('../middleware');

// // // Login
// // router.post('/login', async (req, res) => {
// //     try {
// //         const { email, password } = req.body;
        
// //         // Find user by email
// //         const userData = await User.findOne({ email });
        
// //         if (!userData) {
// //             return res.status(401).json({ message: 'Invalid email or password' });
// //         }
        
// //         // Check if user is verified
// //         if (!userData.isVerified) {
// //             return res.status(401).json({ 
// //                 message: 'Please verify your email before logging in',
// //                 needsVerification: true,
// //                 email: userData.email 
// //             });
// //         }
        
// //         // Compare passwords
// //         const isPasswordValid = await bcrypt.compare(password, userData.password);
        
// //         if (!isPasswordValid) {
// //             return res.status(401).json({ message: 'Invalid email or password' });
// //         }
        
// //         // Generate token
// //         const token = jwt.sign(
// //             { 
// //                 email: userData.email, 
// //                 userId: userData._id, 
// //                 firstName: userData.firstName, 
// //                 lastName: userData.lastName,
// //                 role: userData.role 
// //             }, 
// //             'secretKey',
// //             { expiresIn: '24h' }
// //         );
        
// //         // Return user data without sensitive information
// //         const userResponse = {
// //             id: userData._id,
// //             email: userData.email,
// //             firstName: userData.firstName,
// //             lastName: userData.lastName,
// //             role: userData.role,
// //             isVerified: userData.isVerified
// //         };
        
// //         res.json({ 
// //             message: 'Login successful', 
// //             user: userResponse, 
// //             token: token 
// //         });
        
// //     } catch (error) {
// //         console.error('Login error:', error);
// //         res.status(500).json({ message: 'Something went wrong', error: error.message });
// //     }
// // });

// // // Get all users (protected)
// // router.get('/users', verifyToken, async (req, res) => {
// //     try {
// //         // Only admin can view all users
// //         if (req.user.role !== 'admin') {
// //             return res.status(403).json({ message: 'Access denied. Admin only.' });
// //         }
        
// //         const users = await User.find().select('-password -confirmPassword');
        
// //         if (!users || users.length === 0) {
// //             return res.status(404).json({ message: 'No users found' });
// //         }
        
// //         return res.status(200).json(users);
// //     } catch (error) {
// //         return res.status(500).json({ message: 'Error fetching users', error: error.message });
// //     }
// // });

// // // Get user by email (protected)
// // router.get('/getusersdatabyEmail', verifyToken, async (req, res) => {
// //     try {
// //         const { email } = req.user;
// //         const userdata = await User.findOne({ email }).select('-password -confirmPassword');
        
// //         if (userdata) {
// //             return res.json({ data: userdata });
// //         } else {
// //             res.status(404).json({ message: "User not found" });
// //         }
// //     } catch (error) {
// //         res.status(500).json({ message: 'Something went wrong', error: error.message });
// //     }
// // });

// // // Verify token (protected)
// // router.get('/verify', verifyToken, async (req, res) => {    try {
// //         const user = await User.findOne({ email: req.user.email }).select('-password -confirmPassword');
        
// //         if (!user) {
// //             return res.status(404).json({ valid: false, message: 'User not found' });
// //         }
        
// //         res.json({ 
// //             valid: true, 
// //             user: {
// //                 id: user._id,
// //                 email: user.email,
// //                 firstName: user.firstName,
// //                 lastName: user.lastName,
// //                 role: user.role,
// //                 isVerified: user.isVerified
// //             }
// //         });
// //     } catch (error) {
// //         res.status(500).json({ valid: false, message: error.message });
// //     }
// // });

// // // Logout (optional - client-side mainly)
// // router.post('/logout', verifyToken, (req, res) => {
// //     res.json({ message: 'Logged out successfully' });
// // });

// // module.exports = router;



// const express = require("express");
// const router = express.Router();
// const User = require('../models/userModel');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { verifyToken, isAdmin } = require('../middleware'); // FIXED: Destructure the import

// // Login
// router.post('/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
        
//         // Find user by email
//         const userData = await User.findOne({ email });
        
//         if (!userData) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }
        
//         // Check if user is verified
//         if (!userData.isVerified) {
//             return res.status(401).json({ 
//                 message: 'Please verify your email before logging in',
//                 needsVerification: true,
//                 email: userData.email 
//             });
//         }
        
//         // Compare passwords
//         const isPasswordValid = await bcrypt.compare(password, userData.password);
        
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: 'Invalid email or password' });
//         }
        
//         // Generate token
//         const token = jwt.sign(
//             { 
//                 email: userData.email, 
//                 userId: userData._id, 
//                 firstName: userData.firstName, 
//                 lastName: userData.lastName,
//                 role: userData.role 
//             }, 
//             'secretKey',
//             { expiresIn: '24h' }
//         );
        
//         // Return user data without sensitive information
//         const userResponse = {
//             id: userData._id,
//             email: userData.email,
//             firstName: userData.firstName,
//             lastName: userData.lastName,
//             role: userData.role,
//             isVerified: userData.isVerified
//         };
        
//         res.json({ 
//             message: 'Login successful', 
//             user: userResponse, 
//             token: token 
//         });
        
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ message: 'Something went wrong', error: error.message });
//     }
// });

// // Get all users (protected)
// router.get('/users', verifyToken, async (req, res) => {
//     try {
//         // Only admin can view all users
//         if (req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Access denied. Admin only.' });
//         }
        
//         const users = await User.find().select('-password -confirmPassword');
        
//         if (!users || users.length === 0) {
//             return res.status(404).json({ message: 'No users found' });
//         }
        
//         return res.status(200).json(users);
//     } catch (error) {
//         return res.status(500).json({ message: 'Error fetching users', error: error.message });
//     }
// });

// // Get user by email (protected)
// router.get('/getusersdatabyEmail', verifyToken, async (req, res) => {
//     try {
//         const { email } = req.user;
//         const userdata = await User.findOne({ email }).select('-password -confirmPassword');
        
//         if (userdata) {
//             return res.json({ data: userdata });
//         } else {
//             res.status(404).json({ message: "User not found" });
//         }
//     } catch (error) {
//         res.status(500).json({ message: 'Something went wrong', error: error.message });
//     }
// });

// // Verify token (protected)
// router.get('/verify', verifyToken, async (req, res) => {
//     try {
//         const user = await User.findOne({ email: req.user.email }).select('-password -confirmPassword');
        
//         if (!user) {
//             return res.status(404).json({ valid: false, message: 'User not found' });
//         }
        
//         res.json({ 
//             valid: true, 
//             user: {
//                 id: user._id,
//                 email: user.email,
//                 firstName: user.firstName,
//                 lastName: user.lastName,
//                 role: user.role,
//                 isVerified: user.isVerified
//             }
//         });
//     } catch (error) {
//         res.status(500).json({ valid: false, message: error.message });
//     }
// });

// // Logout (optional - client-side mainly)
// router.post('/logout', verifyToken, (req, res) => {
//     res.json({ message: 'Logged out successfully' });
// });

// module.exports = router;


// // const express = require('express');
// // const router = express.Router();
// // const Route = require('../models/routesModel');
// // const User = require('../models/userModel');
// // const { verifyToken, isAdmin } = require('../middleware');

// // // ==================== PUBLIC ENDPOINTS ====================

// // // Get all active routes for dropdown
// // router.get('/routes/active', async (req, res) => {
// //     try {
// //         const routes = await Route.find({ status: 'active' })
// //             .select('_id routeName routeCode origin destination distance duration stops')
// //             .sort({ routeName: 1 });

// //         const formattedRoutes = routes.map(route => ({
// //             _id: route._id,
// //             routeName: route.routeName,
// //             routeCode: route.routeCode,
// //             origin: route.origin,
// //             destination: route.destination,
// //             distance: route.distance,
// //             duration: route.duration,
// //             boardingPoints: route.boardingPoints,
// //             mealStops: route.mealStops,
// //             totalStops: route.totalStops
// //         }));

// //         res.json({
// //             success: true,
// //             count: formattedRoutes.length,
// //             data: formattedRoutes
// //         });

// //     } catch (error) {
// //         console.error('Get active routes error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error fetching routes',
// //             error: error.message
// //         });
// //     }
// // });

// // // ==================== ADMIN ENDPOINTS ====================

// // // Get all routes (admin only)
// // router.get('/admin/routes', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const { status, search } = req.query;
// //         let query = {};

// //         if (status && status !== 'all') {
// //             query.status = status;
// //         }

// //         if (search) {
// //             query.$or = [
// //                 { routeName: { $regex: search, $options: 'i' } },
// //                 { routeCode: { $regex: search, $options: 'i' } },
// //                 { origin: { $regex: search, $options: 'i' } },
// //                 { destination: { $regex: search, $options: 'i' } }
// //             ];
// //         }

// //         const routes = await Route.find(query)
// //             .populate('createdBy', 'firstName lastName email')
// //             .sort({ createdAt: -1 });

// //         res.json({
// //             success: true,
// //             count: routes.length,
// //             data: routes
// //         });

// //     } catch (error) {
// //         console.error('Get admin routes error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error fetching routes',
// //             error: error.message
// //         });
// //     }
// // });

// // // Get single route by ID (admin only)
// // router.get('/admin/routes/:id', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const route = await Route.findById(req.params.id)
// //             .populate('createdBy', 'firstName lastName email');

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             data: route
// //         });

// //     } catch (error) {
// //         console.error('Get route error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error fetching route',
// //             error: error.message
// //         });
// //     }
// // });

// // // Create new route (admin only)
// // router.post('/admin/routes', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const {
// //             routeName,
// //             routeCode,
// //             origin,
// //             destination,
// //             distance,
// //             duration,
// //             stops,
// //             status
// //         } = req.body;

// //         // Check if route name already exists
// //         const existingRoute = await Route.findOne({ 
// //             $or: [
// //                 { routeName },
// //                 { routeCode: routeCode?.toUpperCase() }
// //             ]
// //         });

// //         if (existingRoute) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'Route with this name or code already exists'
// //             });
// //         }

// //         const user = await User.findOne({ email: req.user.email });

// //         // Sort stops by order if provided
// //         let sortedStops = [];
// //         if (stops && stops.length > 0) {
// //             sortedStops = stops.sort((a, b) => a.order - b.order);
// //         }

// //         const route = new Route({
// //             routeName,
// //             routeCode: routeCode?.toUpperCase(),
// //             origin,
// //             destination,
// //             distance,
// //             duration,
// //             stops: sortedStops,
// //             status: status || 'active',
// //             createdBy: user._id
// //         });

// //         await route.save();

// //         res.status(201).json({
// //             success: true,
// //             message: 'Route created successfully',
// //             data: route
// //         });

// //     } catch (error) {
// //         console.error('Create route error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error creating route',
// //             error: error.message
// //         });
// //     }
// // });

// // // Update route (admin only)
// // router.put('/admin/routes/:id', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const {
// //             routeName,
// //             routeCode,
// //             origin,
// //             destination,
// //             distance,
// //             duration,
// //             stops,
// //             status
// //         } = req.body;

// //         // Check if route name exists for another route
// //         const existingRoute = await Route.findOne({
// //             $or: [
// //                 { routeName, _id: { $ne: req.params.id } },
// //                 { routeCode: routeCode?.toUpperCase(), _id: { $ne: req.params.id } }
// //             ]
// //         });

// //         if (existingRoute) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'Route with this name or code already exists'
// //             });
// //         }

// //         // Sort stops by order if provided
// //         let sortedStops = [];
// //         if (stops && stops.length > 0) {
// //             sortedStops = stops.sort((a, b) => a.order - b.order);
// //         }

// //         const route = await Route.findByIdAndUpdate(
// //             req.params.id,
// //             {
// //                 routeName,
// //                 routeCode: routeCode?.toUpperCase(),
// //                 origin,
// //                 destination,
// //                 distance,
// //                 duration,
// //                 stops: sortedStops,
// //                 status
// //             },
// //             { new: true, runValidators: true }
// //         );

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: 'Route updated successfully',
// //             data: route
// //         });

// //     } catch (error) {
// //         console.error('Update route error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error updating route',
// //             error: error.message
// //         });
// //     }
// // });

// // // Delete route (admin only)
// // router.delete('/admin/routes/:id', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const route = await Route.findById(req.params.id);

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         // Check if route has buses assigned
// //         const Bus = require('../models/busModel');
// //         const buses = await Bus.find({ routeId: route._id });
// //         if (buses.length > 0) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'Cannot delete route with assigned buses'
// //             });
// //         }

// //         await route.deleteOne();

// //         res.json({
// //             success: true,
// //             message: 'Route deleted successfully'
// //         });

// //     } catch (error) {
// //         console.error('Delete route error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error deleting route',
// //             error: error.message
// //         });
// //     }
// // });

// // // ==================== STOPS MANAGEMENT ====================

// // // GET route stops (public - no auth required)
// // router.get('/routes/:id/stops', async (req, res) => {
// //     try {
// //         const route = await Route.findById(req.params.id).select('stops routeName origin destination');

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             data: {
// //                 routeName: route.routeName,
// //                 origin: route.origin,
// //                 destination: route.destination,
// //                 stops: route.stops || []
// //             }
// //         });

// //     } catch (error) {
// //         console.error('Get route stops error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error fetching route stops',
// //             error: error.message
// //         });
// //     }
// // });

// // // UPDATE route stops (admin only)
// // router.put('/routes/:id/stops', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const { stops } = req.body;

// //         if (!Array.isArray(stops)) {
// //             return res.status(400).json({
// //                 success: false,
// //                 message: 'Stops must be an array'
// //             });
// //         }

// //         // Validate stops
// //         for (const stop of stops) {
// //             if (!stop.name || !stop.arrivalTime || !stop.departureTime) {
// //                 return res.status(400).json({
// //                     success: false,
// //                     message: 'Each stop must have name, arrivalTime, and departureTime'
// //                 });
// //             }
// //         }

// //         // Sort stops by order
// //         const sortedStops = stops.sort((a, b) => a.order - b.order);

// //         const route = await Route.findByIdAndUpdate(
// //             req.params.id,
// //             { stops: sortedStops },
// //             { new: true, runValidators: true }
// //         );

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         res.json({
// //             success: true,
// //             message: 'Stops updated successfully',
// //             data: route.stops
// //         });

// //     } catch (error) {
// //         console.error('Update stops error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error updating stops',
// //             error: error.message
// //         });
// //     }
// // });

// // // ADD a single stop to route (admin only)
// // router.post('/routes/:id/stops', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const route = await Route.findById(req.params.id);

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         const newStop = {
// //             ...req.body,
// //             order: route.stops ? route.stops.length : 0
// //         };

// //         route.stops.push(newStop);
// //         await route.save();

// //         res.status(201).json({
// //             success: true,
// //             message: 'Stop added successfully',
// //             data: newStop
// //         });

// //     } catch (error) {
// //         console.error('Add stop error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error adding stop',
// //             error: error.message
// //         });
// //     }
// // });

// // // UPDATE a single stop (admin only)
// // router.put('/routes/:routeId/stops/:stopId', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const route = await Route.findById(req.params.routeId);

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         const stopIndex = route.stops.findIndex(
// //             stop => stop._id.toString() === req.params.stopId
// //         );

// //         if (stopIndex === -1) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Stop not found'
// //             });
// //         }

// //         // Update stop
// //         route.stops[stopIndex] = {
// //             ...route.stops[stopIndex].toObject(),
// //             ...req.body
// //         };

// //         await route.save();

// //         res.json({
// //             success: true,
// //             message: 'Stop updated successfully',
// //             data: route.stops[stopIndex]
// //         });

// //     } catch (error) {
// //         console.error('Update stop error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error updating stop',
// //             error: error.message
// //         });
// //     }
// // });

// // // DELETE a single stop (admin only)
// // router.delete('/routes/:routeId/stops/:stopId', verifyToken, isAdmin, async (req, res) => {
// //     try {
// //         const route = await Route.findById(req.params.routeId);

// //         if (!route) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Route not found'
// //             });
// //         }

// //         const stopIndex = route.stops.findIndex(
// //             stop => stop._id.toString() === req.params.stopId
// //         );

// //         if (stopIndex === -1) {
// //             return res.status(404).json({
// //                 success: false,
// //                 message: 'Stop not found'
// //             });
// //         }

// //         // Remove stop
// //         route.stops.splice(stopIndex, 1);

// //         // Reorder remaining stops
// //         route.stops.forEach((stop, index) => {
// //             stop.order = index;
// //         });

// //         await route.save();

// //         res.json({
// //             success: true,
// //             message: 'Stop deleted successfully'
// //         });

// //     } catch (error) {
// //         console.error('Delete stop error:', error);
// //         res.status(500).json({
// //             success: false,
// //             message: 'Error deleting stop',
// //             error: error.message
// //         });
// //     }
// // });

// // module.exports = router;






const express = require("express");
const router = express.Router();
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin } = require('../middleware');

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        const userData = await User.findOne({ email });
        
        if (!userData) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        if (!userData.isVerified) {
            return res.status(401).json({ 
                success: false,
                message: 'Please verify your email before logging in',
                needsVerification: true,
                email: userData.email 
            });
        }
        
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        // Generate token with role included
        const token = jwt.sign(
            { 
                email: userData.email, 
                userId: userData._id, 
                firstName: userData.firstName, 
                lastName: userData.lastName,
                role: userData.role 
            }, 
            'secretKey',
            { expiresIn: '24h' }
        );
        
        const userResponse = {
            id: userData._id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            isVerified: userData.isVerified
        };
        
        res.json({ 
            success: true,
            message: 'Login successful', 
            user: userResponse, 
            token: token 
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong', 
            error: error.message 
        });
    }
});

// Get all users (admin only)
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password -confirmPassword -__v');
        
        res.json({ 
            success: true,
            data: users 
        });
        
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching users', 
            error: error.message 
        });
    }
});

// Get user by email (protected)
router.get('/user', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const userData = await User.findOne({ email }).select('-password -confirmPassword -__v');
        
        if (userData) {
            res.json({ 
                success: true,
                data: userData 
            });
        } else {
            res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Something went wrong', 
            error: error.message 
        });
    }
});

// Verify token (protected)
router.get('/verify', verifyToken, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).select('-password -confirmPassword -__v');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                valid: false, 
                message: 'User not found' 
            });
        }
        
        res.json({ 
            success: true,
            valid: true, 
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ 
            success: false,
            valid: false, 
            message: error.message 
        });
    }
});

// Logout
router.post('/logout', verifyToken, (req, res) => {
    res.json({ 
        success: true,
        message: 'Logged out successfully' 
    });
});

module.exports = router;