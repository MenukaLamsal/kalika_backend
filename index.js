

// const express = require('express');
// const app = express();
// const connectDb = require('./db');
// const cors = require('cors');
// const userRouter = require('./routes/userRoutes');
// const userVerification = require('./routes/userverification');
// const routeRouter = require('./routes/routeRoute'); 
// const fareRouter = require('./routes/fareRoute'); // Make sure this matches your filename
// const busRouter = require('./routes/busRoutes');
// const bookingRouter = require('./routes/bookingRoute'); 
// const customerRouter = require('./routes/customerRoutes');


// // Connect to database
// connectDb();

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // CORS configuration
// app.use(cors({
//     origin: 'http://localhost:4200',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Redirect for backward compatibility
// app.get('/verify-signup', (req, res) => {
//     const { token } = req.query;
//     if (!token) {
//         return res.status(400).send('No token provided');
//     }
//     console.log('Redirecting verification to API route');
//     res.redirect(`/api/auth/verify-signup?token=${token}`);
// });

// // Routes
// app.use('/api/auth', userRouter);
// app.use('/api/auth', userVerification);
// app.use('/api', routeRouter);
// app.use('/api', fareRouter);
// app.use('/api', busRouter);
// app.use('/api', customerRouter);
// app.use('/api', bookingRouter); 
// // Test route
// app.get('/', (req, res) => {
//     res.json({ message: 'API is running' });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error('Error:', err.stack);
//     res.status(500).json({ 
//         message: 'Something went wrong!',
//         error: process.env.NODE_ENV === 'development' ? err.message : {}
//     });
// });

// // 404 handler
// app.use((req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });

// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//     console.log(`http://localhost:${PORT}`);
// });



const express = require('express');
const app = express();
const connectDb = require('./db');
const cors = require('cors');
const userRouter = require('./routes/userRoutes');
const userVerification = require('./routes/userverification');
const routeRouter = require('./routes/routeRoute'); 
const fareRouter = require('./routes/fareRoute');
const busRouter = require('./routes/busRoutes');
const bookingRouter = require('./routes/bookingRoute');
const customerRouter = require('./routes/customerRoutes'); // Add customer routes
const boardingPointRouter = require('./routes/boardingPointRoutes'); // Add boarding point routes

// Connect to database
connectDb();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware (for development)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Redirect for backward compatibility
app.get('/verify-signup', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send('No token provided');
    }
    console.log('Redirecting verification to API route');
    res.redirect(`/api/auth/verify-signup?token=${token}`);
});

// Routes
app.use('/api/auth', userRouter);
app.use('/api/auth', userVerification);
app.use('/api', routeRouter);
app.use('/api', fareRouter);
app.use('/api', busRouter);
app.use('/api', bookingRouter);
app.use('/api', customerRouter); // Register customer routes
app.use('/api', boardingPointRouter); // Register boarding point routes

// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: 'API is running',
        version: '1.0.0',
        timestamp: new Date(),
        endpoints: {
            auth: ['/api/auth/login', '/api/auth/register', '/api/auth/verify'],
            routes: ['/api/routes', '/api/routes/:id', '/api/routes/:id/stops'],
            fares: ['/api/fares', '/api/fares/:id'],
            buses: ['/api/buses/search', '/api/buses/public/:id', '/api/buses/:id/boarding-points'],
            bookings: ['/api/bookings', '/api/bookings/my-bookings', '/api/bookings/:id'],
            customers: ['/api/customers', '/api/customers/stats', '/api/customers/cities', '/api/customers/:id']
        }
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route not found' 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 API URL: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});