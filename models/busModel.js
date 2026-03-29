const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    busNumber: {
        type: String,
        required: [true, 'Bus number is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    busName: {
        type: String,
        required: [true, 'Bus name is required'],
        trim: true
    },
    busType: {
        type: String,
        required: [true, 'Bus type is required'],
        enum: ['AC Sleeper', 'AC Seater', 'Non-AC Sleeper', 'Non-AC Seater', 'Luxury', 'Volvo']
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: [true, 'Route is required']
    },
    driverName: {
        type: String,
        required: [true, 'Driver name is required']
    },
    driverPhone: {
        type: String,
        required: [true, 'Driver phone is required'],
        match: [/^[0-9]{10}$/, 'Please enter valid 10-digit phone number']
    },
    driverLicense: {
        type: String,
        required: [true, 'Driver license is required'],
        uppercase: true
    },
    totalSeats: {
        type: Number,
        required: [true, 'Total seats is required'],
        min: [10, 'Minimum 10 seats required'],
        max: [60, 'Maximum 60 seats allowed']
    },
    seatLayout: {
        type: String,
        enum: ['2x2', '2x1', '1x2', '2x3'],
        default: '2x2'
    },
    amenities: [{
        type: String,
        enum: ['AC', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Snacks', 'Movie', 'GPS', 'Reading Light']
    }],
    fare: {
        type: Number,
        required: true,
        min: [0, 'Fare cannot be negative']
    },
    departureTime: {
        type: String,
        required: [true, 'Departure time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    arrivalTime: {
        type: String,
        required: [true, 'Arrival time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    departureDate: {
        type: Date,
        required: [true, 'Departure date is required']
    },
    arrivalDate: {
        type: Date,
        required: [true, 'Arrival date is required']
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance', 'cancelled'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for search
busSchema.index({ busNumber: 1, busName: 1 });
busSchema.index({ routeId: 1, status: 1 });
busSchema.index({ departureDate: 1 });

// Virtual for operator name
busSchema.virtual('operator').get(function() {
    return this.busName?.split(' ')[0] || 'Travels';
});

// Ensure virtuals are included in JSON
busSchema.set('toJSON', { virtuals: true });
busSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Bus', busSchema);