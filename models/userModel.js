const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNo: { type: String },
    mobileNo: { type: String },
    address: { type: String },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: { type: String, required: true },
    confirmPassword: { type: String, required: true },
    termCondition: { type: Boolean, default: false },
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    },
    isVerified: { type: Boolean, default: false },
    registeredDate: { type: String }
});

const User = mongoose.model('User', userSchema);
module.exports = User;