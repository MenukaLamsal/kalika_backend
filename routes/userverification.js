const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'karthikpokharel@gmail.com',
        pass: 'jmnw tvvi dftt pynb', // Make sure this is correct
    }
});

// Test email connection
transporter.verify((error, success) => {
    if (error) {
        console.log('Email server error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// Send verification email
async function sendVerificationEmail(user) {
    const token = jwt.sign(
        { email: user.email },
        'secretKey',
        { expiresIn: '1h' }
    );
    
    // IMPORTANT: Use the correct URL with /api/auth prefix
    const verificationUrl = `http://localhost:3000/api/auth/verify-signup?token=${token}`;
    
    console.log('Generated verification URL:', verificationUrl); // For debugging
    
    const mailOptions = {
        from: '"Travel Agency" <karthikpokharel@gmail.com>',
        to: user.email,
        subject: 'Email Verification for Signup',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px;">Welcome to Travel Agency!</h1>
                </div>
                
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
                    <p style="font-size: 16px; margin-bottom: 25px;">Hello <strong>${user.firstName}</strong>,</p>
                    
                    <p style="font-size: 16px; margin-bottom: 25px;">Thank you for registering with us! Please verify your email address by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${verificationUrl}" 
                           style="background-color: #4CAF50; 
                                  color: white; 
                                  padding: 14px 40px; 
                                  text-decoration: none; 
                                  border-radius: 5px;
                                  display: inline-block;
                                  font-size: 18px;
                                  font-weight: bold;
                                  box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            Verify Email Address
                        </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Or copy and paste this link in your browser:</p>
                    <p style="font-size: 12px; color: #999; word-break: break-all; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #e0e0e0;">
                        ${verificationUrl}
                    </p>
                    
                    <p style="font-size: 14px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        This link will expire in <strong>1 hour</strong>. If you didn't create an account, please ignore this email.
                    </p>
                </div>
            </body>
            </html>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent successfully to:', user.email);
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        return true;
    } catch (error) {
        console.error('❌ Email send error:', error);
        return false;
    }
}

// Signup route
router.post('/signupUser', async (req, res) => {
    try {
        const { firstName, lastName, phoneNo, mobileNo, address, email, password, confirmPassword, termCondition, role } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Please fill all required fields' 
            });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ 
                success: false,
                message: 'Passwords do not match' 
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser && existingUser.isVerified) {
            return res.status(409).json({ 
                success: false,
                message: 'Email already registered' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        if (existingUser && !existingUser.isVerified) {
            // Update existing unverified user
            existingUser.firstName = firstName;
            existingUser.lastName = lastName;
            existingUser.phoneNo = phoneNo;
            existingUser.mobileNo = mobileNo;
            existingUser.address = address;
            existingUser.password = hashedPassword;
            existingUser.confirmPassword = hashedPassword;
            existingUser.termCondition = termCondition;
            existingUser.role = role || "customer";
            existingUser.registeredDate = new Date().toLocaleDateString();
            
            await existingUser.save();

            const emailSent = await sendVerificationEmail(existingUser);
            
            if (emailSent) {
                return res.status(200).json({ 
                    success: true,
                    message: 'Registration updated. Please check your email to verify your account',
                    needsVerification: true 
                });
            } else {
                return res.status(500).json({ 
                    success: false,
                    message: 'Failed to send verification email. Please try again.' 
                });
            }
        }

        // Create new user
        const newUser = new User({
            firstName,
            lastName,
            phoneNo,
            mobileNo,
            address,
            email,
            password: hashedPassword,
            confirmPassword: hashedPassword,
            termCondition,
            role: role || "customer",
            isVerified: false,
            registeredDate: new Date().toLocaleDateString()
        });

        await newUser.save();
        
        const emailSent = await sendVerificationEmail(newUser);

        if (emailSent) {
            return res.status(201).json({ 
                success: true,
                message: 'Registration successful. Please check your email to verify your account',
                needsVerification: true 
            });
        } else {
            // Delete the user if email failed
            await User.findByIdAndDelete(newUser._id);
            return res.status(500).json({ 
                success: false,
                message: 'Failed to send verification email. Please try again.' 
            });
        }

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Something went wrong', 
            error: error.message 
        });
    }
});

// Verify email route
router.get('/verify-signup', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ 
                success: false,
                message: 'No verification token provided' 
            });
        }

        console.log('Verifying token:', token);

        let decoded;
        try {
            decoded = jwt.verify(token, 'secretKey');
        } catch (err) {
            console.error('Token verification failed:', err.message);
            return res.status(400).json({ 
                success: false,
                message: 'Verification link expired or invalid' 
            });
        }

        console.log('Decoded token:', decoded);

        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        if (user.isVerified) {
            // Already verified - redirect to login with message
            return res.redirect('http://localhost:4200/login?alreadyVerified=true');
        }

        user.isVerified = true;
        await user.save();
        
        console.log('✅ Email verified successfully for:', user.email);
        
        // Redirect to frontend login page with success message
        return res.redirect('http://localhost:4200/login?verified=true');
        
    } catch (error) {
        console.error('Verification error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Something went wrong', 
            error: error.message 
        });
    }
});

module.exports = router;