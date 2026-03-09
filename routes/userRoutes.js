// const express = require("express");
// const router = express.Router();
// const User = require('../models/userModel');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const verifyToken = require('../middleware');

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