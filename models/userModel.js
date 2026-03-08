const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    firstName: { type: String ,require:true},
    lastName: { type: String ,require:true},
    phoneNo: { type: String },
    mobileNo:{type:String},
    //image: {type:String},
    address: {type:String},
    // from: { type:String },
    // to: { type:String },
    email: {
        type: String,
        unique: true,require:true
    },
    password: { type: String },
    confirmPassword: { type: String },
    termCondition: { type: Boolean },
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    },
    isVerified:{type:Boolean, require:true},
    registeredDate:{type:String}
})
const userBus = mongoose.model('bus', userSchema)
module.exports = userBus;