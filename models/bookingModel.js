const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',  // This references the Bus model
        required: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    busDetails: {
        busNumber: String,
        busName: String,
        busType: String,
        operator: String
    },
    routeDetails: {
        origin: String,
        destination: String,
        departureTime: String,
        arrivalTime: String,
        duration: String,
        distance: Number
    },
    seats: [{
        seatNumber: String,
        price: Number,
        passengerName: String,
        passengerAge: Number,
        passengerGender: String,
        passengerPhone: String,
        passengerEmail: String
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    taxAmount: {
        type: Number,
        required: true
    },
    bookingDate: {
        type: Date,
        default: Date.now
    },
    journeyDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'completed', 'pending'],
        default: 'confirmed'
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'pending', 'refunded'],
        default: 'paid'
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking', 'wallet'],
        default: 'card'
    },
    cancellationDetails: {
        cancelledAt: Date,
        refundAmount: Number,
        reason: String
    }
}, {
    timestamps: true
});

// Generate booking ID before saving
bookingSchema.pre('save', async function(next) {
    if (!this.bookingId) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.bookingId = `TRE${year}${month}${day}${random}`;
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);