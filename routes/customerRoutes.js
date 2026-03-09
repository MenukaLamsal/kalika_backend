const express = require('express');
const router = express.Router();
const Customer = require('../models/customerModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const { verifyToken, isAdmin } = require('../middleware');

// ==================== ADMIN CUSTOMER ENDPOINTS ====================

// Get all customers with filters and pagination
router.get('/customers', verifyToken, isAdmin, async (req, res) => {
    try {
        const { 
            status, 
            gender, 
            city, 
            search, 
            fromDate, 
            toDate,
            page = 1, 
            limit = 10 
        } = req.query;

        let query = {};

        // Filter by status
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter by gender
        if (gender && gender !== 'all') {
            query.gender = gender;
        }

        // Filter by city
        if (city && city !== 'all') {
            query.city = city;
        }

        // Date range filter
        if (fromDate || toDate) {
            query.registeredOn = {};
            if (fromDate) query.registeredOn.$gte = new Date(fromDate);
            if (toDate) query.registeredOn.$lte = new Date(toDate);
        }

        // Search functionality
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { customerId: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        // Execute query
        const customers = await Customer.find(query)
            .sort({ registeredOn: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('createdBy', 'firstName lastName email');

        const total = await Customer.countDocuments(query);

        res.json({
            success: true,
            count: customers.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limitNum),
            data: customers
        });

    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers',
            error: error.message
        });
    }
});

// Get customer statistics
router.get('/customers/stats', verifyToken, isAdmin, async (req, res) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const activeCustomers = await Customer.countDocuments({ status: 'active' });
        const inactiveCustomers = await Customer.countDocuments({ status: 'inactive' });
        const blockedCustomers = await Customer.countDocuments({ status: 'blocked' });
        
        // Total revenue from all customers' bookings
        const revenueResult = await Customer.aggregate([
            { $group: { _id: null, total: { $sum: '$totalSpent' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
        
        // Average spending per customer
        const averageSpending = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

        // Customer growth data (last 12 months)
        const growthData = await Customer.aggregate([
            {
                $match: {
                    registeredOn: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 11))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$registeredOn' },
                        month: { $month: '$registeredOn' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Format growth data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedGrowthData = growthData.map(item => ({
            month: months[item._id.month - 1],
            count: item.count
        }));

        // Booking trend data (last 12 months)
        const bookingTrend = await Booking.aggregate([
            {
                $match: {
                    bookingDate: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 11))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$bookingDate' },
                        month: { $month: '$bookingDate' }
                    },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        const formattedBookingTrend = bookingTrend.map(item => ({
            month: months[item._id.month - 1],
            bookings: item.bookings
        }));

        res.json({
            success: true,
            data: {
                totalCustomers,
                activeCustomers,
                inactiveCustomers,
                blockedCustomers,
                totalRevenue,
                averageSpending: Math.round(averageSpending),
                growthData: formattedGrowthData,
                bookingTrend: formattedBookingTrend
            }
        });

    } catch (error) {
        console.error('Get customer stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer statistics',
            error: error.message
        });
    }
});

// Get all unique cities
router.get('/customers/cities', verifyToken, isAdmin, async (req, res) => {
    try {
        const cities = await Customer.distinct('city', { city: { $ne: null } });
        cities.sort();
        
        res.json({
            success: true,
            data: cities
        });

    } catch (error) {
        console.error('Get cities error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cities',
            error: error.message
        });
    }
});

// Get single customer by ID
router.get('/customers/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('createdBy', 'firstName lastName email');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            data: customer
        });

    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer',
            error: error.message
        });
    }
});

// Create new customer
router.post('/customers', verifyToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });
        
        const customerData = {
            ...req.body,
            createdBy: user._id
        };

        // Check if email already exists
        const existingEmail = await Customer.findOne({ email: customerData.email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        // Check if phone already exists
        const existingPhone = await Customer.findOne({ phone: customerData.phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        // Check if ID proof number already exists
        const existingIdProof = await Customer.findOne({ idProofNumber: customerData.idProofNumber });
        if (existingIdProof) {
            return res.status(400).json({
                success: false,
                message: 'ID proof number already registered'
            });
        }

        const customer = new Customer(customerData);
        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: customer
        });

    } catch (error) {
        console.error('Create customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating customer',
            error: error.message
        });
    }
});

// Update customer
router.put('/customers/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Check if email exists for another customer
        if (updates.email) {
            const existingEmail = await Customer.findOne({ 
                email: updates.email,
                _id: { $ne: id }
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        }

        // Check if phone exists for another customer
        if (updates.phone) {
            const existingPhone = await Customer.findOne({ 
                phone: updates.phone,
                _id: { $ne: id }
            });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'Phone number already registered'
                });
            }
        }

        // Check if ID proof number exists for another customer
        if (updates.idProofNumber) {
            const existingIdProof = await Customer.findOne({ 
                idProofNumber: updates.idProofNumber,
                _id: { $ne: id }
            });
            if (existingIdProof) {
                return res.status(400).json({
                    success: false,
                    message: 'ID proof number already registered'
                });
            }
        }

        const customer = await Customer.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: customer
        });

    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer',
            error: error.message
        });
    }
});

// Delete customer
router.delete('/customers/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if customer has any bookings
        if (customer.totalBookings > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete customer with existing bookings'
            });
        }

        await customer.deleteOne();

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });

    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message
        });
    }
});

// Toggle customer status
router.patch('/customers/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        customer.status = customer.status === 'active' ? 'inactive' : 'active';
        await customer.save();

        res.json({
            success: true,
            message: `Customer ${customer.status === 'active' ? 'activated' : 'deactivated'} successfully`,
            data: customer
        });

    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error toggling customer status',
            error: error.message
        });
    }
});

// Get customer bookings
router.get('/customers/:id/bookings', verifyToken, isAdmin, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Find bookings by customer email or phone
        const bookings = await Booking.find({
            $or: [
                { 'seats.passengerEmail': customer.email },
                { 'seats.passengerPhone': customer.phone }
            ]
        }).sort({ journeyDate: -1 }).limit(10);

        res.json({
            success: true,
            count: bookings.length,
            data: bookings
        });

    } catch (error) {
        console.error('Get customer bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer bookings',
            error: error.message
        });
    }
});

// Export customers (simulated - in real app would generate file)
router.get('/customers/export/:format', verifyToken, isAdmin, async (req, res) => {
    try {
        const { format } = req.params;
        const { status, gender, city, search } = req.query;

        let query = {};

        if (status && status !== 'all') query.status = status;
        if (gender && gender !== 'all') query.gender = gender;
        if (city && city !== 'all') query.city = city;

        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(query).sort({ registeredOn: -1 });

        // In a real app, you'd generate PDF/Excel/CSV here
        // For now, just return JSON
        res.json({
            success: true,
            message: `Exporting ${customers.length} customers as ${format}`,
            data: customers
        });

    } catch (error) {
        console.error('Export customers error:', error);
        res.status(500).json({
            success: false,
            message: 'Error exporting customers',
            error: error.message
        });
    }
});

// Send email to customer (simulated)
router.post('/customers/:id/send-email', verifyToken, isAdmin, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // In a real app, you'd send actual email here
        console.log(`Sending email to ${customer.email}:`, req.body);

        res.json({
            success: true,
            message: `Email sent successfully to ${customer.email}`
        });

    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending email',
            error: error.message
        });
    }
});

// Send SMS to customer (simulated)
router.post('/customers/:id/send-sms', verifyToken, isAdmin, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // In a real app, you'd send actual SMS here
        console.log(`Sending SMS to ${customer.phone}:`, req.body);

        res.json({
            success: true,
            message: `SMS sent successfully to ${customer.phone}`
        });

    } catch (error) {
        console.error('Send SMS error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending SMS',
            error: error.message
        });
    }
});

module.exports = router;