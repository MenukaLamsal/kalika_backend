

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    seats: [{
        seatNumber: { type: String, required: true },
        passengerName: { type: String, required: true },
        passengerAge: { type: Number, required: true },
        passengerGender: { type: String, required: true },
        passengerPhone: { type: String, required: true },
        passengerEmail: { type: String }
    }],
    selectedSeats: [{
        seatNumber: String,
        seatType: String,
        price: Number
    }],
    passengerDetails: [{
        name: String,
        age: Number,
        gender: String,
        seatNumber: String,
        phone: String,
        email: String
    }],
    totalAmount: { type: Number, required: true },
    taxAmount: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['khalti', 'esewa', 'cash'],
        required: true
    },
    paymentDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
    boardingPoint: { type: String, default: '' },
    bookingStatus: {
        type: String,
        enum: ['confirmed', 'cancelled', 'expired', 'pending'],
        default: 'confirmed'
    },
    bookingDate: { type: Date, default: Date.now },
    travelDate: { type: Date, required: true },
    journeyDate: { type: Date, required: true },
    contactNumber: { type: String },
    email: { type: String },
    cancellationReason: String,
    cancelledAt: Date,
    refundAmount: Number
}, { timestamps: true });

// Indexes
bookingSchema.index({ userId: 1, bookingDate: -1 });
bookingSchema.index({ busId: 1, travelDate: 1 });
bookingSchema.index({ bookingId: 1 });

// Generate booking ID before saving
bookingSchema.pre('save', async function(next) {
    if (this.isNew && !this.bookingId) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.bookingId = `BK${year}${month}${day}${random}`;
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);