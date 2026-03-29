const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Stop name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['boarding', 'dropping', 'rest', 'meal', 'pickup'],
        default: 'rest'
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    arrivalTime: {
        type: String,
        required: [true, 'Arrival time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    departureTime: {
        type: String,
        required: [true, 'Departure time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    duration: {
        type: Number,
        default: 30,
        min: [5, 'Minimum stop duration is 5 minutes']
    },
    fare: {
        type: Number,
        default: 0,
        min: [0, 'Fare cannot be negative']
    },
    contact: {
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter valid 10-digit phone number']
    },
    landmark: String,
    amenities: [{
        type: String,
        enum: ['Restroom', 'Food Court', 'Parking', 'ATM', 'Medical', 'Waiting Room', 'Restaurant']
    }],
    isMealStop: {
        type: Boolean,
        default: false
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks', null],
        default: null
    },
    description: String,
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        required: true
    }
});

const routeSchema = new mongoose.Schema({
    routeName: {
        type: String,
        required: [true, 'Route name is required'],
        unique: true,
        trim: true
    },
    routeCode: {
        type: String,
        required: [true, 'Route code is required'],
        unique: true,
        uppercase: true,
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

// Virtual for total stops count
routeSchema.virtual('totalStops').get(function() {
    return this.stops ? this.stops.length : 0;
});

// Virtual for boarding points (filter stops by type)
routeSchema.virtual('boardingPoints').get(function() {
    return this.stops ? this.stops.filter(stop => 
        ['boarding', 'pickup'].includes(stop.type)
    ) : [];
});

// Virtual for meal stops
routeSchema.virtual('mealStops').get(function() {
    return this.stops ? this.stops.filter(stop => stop.isMealStop) : [];
});

// Ensure virtuals are included in JSON
routeSchema.set('toJSON', { virtuals: true });
routeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Route', routeSchema);