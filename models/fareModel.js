const mongoose = require('mongoose');

const fareSchema = new mongoose.Schema({
    routeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: [true, 'Route is required']
    },
    busType: {
        type: String,
        required: [true, 'Bus type is required'],
        enum: ['AC Sleeper', 'AC Seater', 'Non-AC Sleeper', 'Non-AC Seater', 'Luxury', 'Volvo']
    },
    baseFare: {
        type: Number,
        required: [true, 'Base fare is required'],
        min: [0, 'Base fare cannot be negative']
    },
    // NEW: Seat capacity configuration
    seatCapacity: {
        totalSeats: {
            type: Number,
            required: [true, 'Total seats is required'],
            min: [10, 'Minimum 10 seats required'],
            max: [60, 'Maximum 60 seats allowed'],
            default: 40
        },
        seatLayout: {
            type: String,
            enum: ['2x2', '2x1', '1x2', '2x3'],
            default: '2x2'
        },
        lowerDeckSeats: {
            type: Number,
            default: 20
        },
        upperDeckSeats: {
            type: Number,
            default: 20
        }
    },
    effectiveFrom: {
        type: Date,
        required: [true, 'Effective from date is required']
    },
    effectiveTo: {
        type: Date,
        required: [true, 'Effective to date is required']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
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

// Ensure unique fare per route and bus type
fareSchema.index({ routeId: 1, busType: 1 }, { unique: true });

module.exports = mongoose.model('Fare', fareSchema);