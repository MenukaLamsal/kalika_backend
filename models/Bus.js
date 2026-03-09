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
    boardingPoints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BoardingPoint'
    }],
    driverName: {
        type: String,
        required: [true, 'Driver name is required']
    },
    driverPhone: {
        type: String,
        required: [true, 'Driver phone is required']
    },
    driverLicense: {
        type: String,
        required: [true, 'Driver license is required']
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
        enum: ['AC', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Snacks', 'Movie', 'GPS']
    }],
    fare: {
        type: Number,
        required: true
    },
    departureTime: {
        type: String,
        default: '08:00'
    },
    arrivalTime: {
        type: String,
        default: '20:00'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
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
busSchema.index({ 'routeId': 1 });

module.exports = mongoose.model('Bus', busSchema);