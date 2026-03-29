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
    perKmRate: {
        type: Number,
        required: [true, 'Per km rate is required'],
        min: [0, 'Per km rate cannot be negative']
    },
    minimumFare: {
        type: Number,
        required: [true, 'Minimum fare is required'],
        min: [0, 'Minimum fare cannot be negative']
    },
    discountPercent: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%']
    },
    taxPercent: {
        type: Number,
        required: true,
        default: 18,
        min: [0, 'Tax cannot be negative'],
        max: [100, 'Tax cannot exceed 100%']
    },
    serviceCharge: {
        type: Number,
        default: 0,
        min: [0, 'Service charge cannot be negative']
    },
    seatFare: {
        type: Map,
        of: Number,
        default: {}
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

// Calculate final fare
fareSchema.methods.calculateFare = function(distance, seatNumber) {
    let fare = this.baseFare;
    
    // Add per km rate
    fare += distance * this.perKmRate;
    
    // Apply minimum fare
    if (fare < this.minimumFare) {
        fare = this.minimumFare;
    }
    
    // Apply seat specific fare if available
    if (seatNumber && this.seatFare && this.seatFare.has(seatNumber)) {
        fare = this.seatFare.get(seatNumber);
    }
    
    // Apply discount
    const discount = (fare * this.discountPercent) / 100;
    const afterDiscount = fare - discount;
    
    // Apply tax
    const tax = (afterDiscount * this.taxPercent) / 100;
    
    // Add service charge
    return Math.round((afterDiscount + tax + this.serviceCharge) * 100) / 100;
};

module.exports = mongoose.model('Fare', fareSchema);