// // const jwt = require('jsonwebtoken');

// // function verifyToken(req, res, next) {
// //     if (!req.headers.authorization) {
// //         return res.status(401).json({ message: 'Unauthorized request - No token provided' });
// //     }
    
// //     const token = req.headers.authorization.split(' ')[1];
// //     if (!token) {
// //         return res.status(401).json({ message: 'Unauthorized request - Token is empty' });
// //     }
    
// //     try {
// //         const payload = jwt.verify(token, 'secretKey');
// //         req.user = payload;
// //         next();
// //     } catch (error) {
// //         return res.status(401).json({ message: 'Unauthorized request - Invalid token' });
// //     }
// // }

// // module.exports = verifyToken;

// const jwt = require('jsonwebtoken');

// // Verify token middleware
// function verifyToken(req, res, next) {
//     if (!req.headers.authorization) {
//         return res.status(401).json({ 
//             success: false,
//             message: 'Unauthorized request - No token provided' 
//         });
//     }
    
//     const token = req.headers.authorization.split(' ')[1];
//     if (!token) {
//         return res.status(401).json({ 
//             success: false,
//             message: 'Unauthorized request - Token is empty' 
//         });
//     }
    
//     try {
//         const payload = jwt.verify(token, 'secretKey');
//         req.user = payload;
//         next();
//     } catch (error) {
//         return res.status(401).json({ 
//             success: false,
//             message: 'Unauthorized request - Invalid token' 
//         });
//     }
// }

// // Check if user is admin middleware
// function isAdmin(req, res, next) {
//     try {
//         if (req.user && req.user.role === 'admin') {
//             next();
//         } else {
//             return res.status(403).json({ 
//                 success: false,
//                 message: 'Access denied. Admin only.' 
//             });
//         }
//     } catch (error) {
//         return res.status(500).json({ 
//             success: false,
//             message: 'Error checking admin status',
//             error: error.message 
//         });
//     }
// }

// module.exports = { verifyToken, isAdmin };



const jwt = require('jsonwebtoken');

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Verify token middleware
function verifyToken(req, res, next) {
    // Check if authorization header exists
    if (!req.headers.authorization) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized request - No token provided' 
        });
    }
    
    // Extract token from Bearer header
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Unauthorized request - Token is empty' 
        });
    }
    
    try {
        // Verify token with secret key
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        // Handle different token errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token has expired. Please login again.',
                expired: true
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token. Please login again.'
            });
        } else {
            return res.status(401).json({ 
                success: false,
                message: 'Unauthorized request - Invalid token' 
            });
        }
    }
}

// Check if user is admin middleware
function isAdmin(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Unauthorized - User not authenticated' 
            });
        }
        
        if (req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Admin only.' 
            });
        }
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Error checking admin status',
            error: error.message 
        });
    }
}

// Optional: Check if user is authenticated (any role)
function isAuthenticated(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'Unauthorized - Please login to continue' 
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: 'Error checking authentication',
            error: error.message 
        });
    }
}

// Optional: Check specific roles
function hasRole(roles) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Unauthorized - Please login to continue' 
                });
            }
            
            if (roles.includes(req.user.role)) {
                next();
            } else {
                return res.status(403).json({ 
                    success: false,
                    message: `Access denied. Required role: ${roles.join(' or ')}` 
                });
            }
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: 'Error checking role',
                error: error.message 
            });
        }
    };
}

module.exports = { 
    verifyToken, 
    isAdmin,
    isAuthenticated,
    hasRole
};