// const mongoose = require('mongoose');

// const seatSchema = new mongoose.Schema({
//   busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
//   seatNumber: { type: String, required: true },
//   row: { type: Number, required: true },
//   column: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] },
//   deck: { type: String, enum: ['lower', 'upper'], default: 'lower' },
//   type: { type: String, enum: ['sleeper', 'seater'], default: 'seater' },
//   price: { type: Number, required: true },
//   isAvailable: { type: Boolean, default: true },
//   isBooked: { type: Boolean, default: false },
//   isLadies: { type: Boolean, default: false },
//   isActive: { type: Boolean, default: true }
// }, { timestamps: true });

// // Compound index to ensure unique seat per bus
// seatSchema.index({ busId: 1, seatNumber: 1 }, { unique: true });

// module.exports = mongoose.model('Seat', seatSchema);
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    seatNumber: {
        type: String,
        required: true
    },
    seatType: {
        type: String,
        enum: ['standard', 'luxury', 'sleeper'],
        default: 'standard'
    },
    seatRow: {
        type: Number,
        required: true
    },
    seatColumn: {
        type: Number,
        required: true
    },
    deck: {
        type: String,
        enum: ['lower', 'upper'],
        default: 'lower'
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'blocked', 'selected'],
        default: 'available'
    },
    price: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for unique seat per bus
seatSchema.index({ busId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);