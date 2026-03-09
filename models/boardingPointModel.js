const mongoose = require('mongoose');

const boardingPointSchema = new mongoose.Schema({
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: [true, 'Bus ID is required']
    },
    name: {
        type: String,
        required: [true, 'Boarding point name is required'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    time: {
        type: String,
        required: [true, 'Boarding time is required'],
        match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time in HH:MM format']
    },
    contact: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^[0-9]{10}$/, 'Please enter valid 10-digit contact number']
    },
    landmark: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    fare: {
        type: Number,
        default: 0,
        min: [0, 'Fare cannot be negative']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
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

// Ensure unique boarding point per bus
boardingPointSchema.index({ busId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('BoardingPoint', boardingPointSchema);