const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Stop name is required']
    },
    arrivalTime: {
        type: String,
        required: [true, 'Arrival time is required']
    },
    departureTime: {
        type: String,
        required: [true, 'Departure time is required']
    },
    fare: {
        type: Number,
        required: [true, 'Fare is required'],
        min: [0, 'Fare cannot be negative']
    }
});

const routeSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: [true, 'Route name is required'],
        unique: true,
        trim: true
    },
    origin: {
        type: String,
        required: [true, 'Origin is required'],
        trim: true
    },
    destination: {
        type: String,
        required: [true, 'Destination is required'],
        trim: true
    },
    distance: {
        type: Number,
        required: [true, 'Distance is required'],
        min: [1, 'Distance must be greater than 0']
    },
    duration: {
        type: String,
        required: [true, 'Duration is required']
    },
    stops: [stopSchema],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    busesAssigned: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// FIXED: Virtual for total stops count with null check
routeSchema.virtual('totalStops').get(function() {
    return this.stops ? this.stops.length : 0;
});

// Ensure virtuals are included in JSON output
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);