const mongoose = require('mongoose');

const boardingPointSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Boarding point name is required']
  },
  address: {
    type: String,
    required: [true, 'Address is required']
  },
  time: {
    type: String,
    required: [true, 'Boarding time is required']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required']
  },
  landmark: String,
  city: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BoardingPoint', boardingPointSchema);