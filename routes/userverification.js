const express = require('express');
const router = express.Router();
const userRegister = require('../models/userModel');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const verifyToken= require('../middleware');
const bcrypt=require('bcrypt');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'karthikpokharel@gmail.com', 
      pass: 'melo illm tkld mvyj',
    }
});

function sendVerificationEmail(user) {
    const token = jwt.sign(
        { email: user.email },
        'secretKey',  
        { expiresIn: '1h' }  // Token expires in 1 hour
    );
    const verificationUrl = `http://localhost:3000/verify-signup?token=${token}`;
    
    const mailOptions = {
        //from: 'sunitaadhikari2001@gmail.com',
        from: 'karthikpokharel@gmail.com',
        to: user.email,
        subject: 'Email Verification for Signup',
        text: `Please click the following link to verify your login: ${verificationUrl}`
    };
    return transporter.sendMail(mailOptions);
}
router.post('/signupUser',  async (req, res) => {
    try {
      const { firstName,lastName,phoneNo,mobileNo, address, email, password, confirmPassword,termCondition, role } = req.body;
  
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
  
      const currentDate = new Date();
      const formattedDate = currentDate.toDateString();

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedconfirmPassword = await bcrypt.hash(confirmPassword, 10);
      const user = await userRegister.findOne({ email });

  
      if (!user) {
        const newUser = new userRegister({
            firstName,
            lastName,
            phoneNo,
            mobileNo,
            address,
            email,
            password:hashedPassword,
            confirmPassword:hashedconfirmPassword,
            termCondition,
            role,
            isVerified: false,
            registereddate: formattedDate
        });
  
        await newUser.save();
        await sendVerificationEmail(newUser);
  
        return res.status(201).json({ message: 'Registration successful, please check your email to verify your account' });
      }
  
      if (user.isVerified) {
        return res.status(409).json({ message: 'Already registered.', user });
      } else {
        const newUser = await userRegister.findOneAndUpdate(
          { email },
          {
            firstName,
            lastName,
            phoneNo,
            mobileNo,
            address,
            email,
            password:hashedPassword,
            confirmPassword:hashedconfirmPassword,
            termCondition,
            role,
            isVerified: false,
            registereddate: formattedDate
          },
          { new: true }
        );
  
        await sendVerificationEmail(newUser);
        return res.status(200).json({ message: 'Registration successful, please check your email to verify your account' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  });
  


router.get('/verify-signup', async (req, res) => {
    try {
        const { token } = req.query;

        let decoded;
        try {
            decoded = jwt.verify(token, 'secretKey');  
        } catch (err) {
            return res.json({ message: 'Verification link expired or invalid' });
        }

        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            return res.json({ message: 'Invalid verification link' });
        }

        user.isVerified = true;
        await user.save();
        console.log('Email verification successful, you can now log in');
        return res.redirect('http://localhost:4200/login');
        //return res.status(200).json({ message: 'Email verification successful, you can now log in' });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong', error });
    }
});


// Step 1: Request Password Reset
router.post('/request-reset-password', async (req, res) => {
    const { email } = req.body;
    const user = await userRegister.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const token = jwt.sign({ email: user.email }, 'secretKey', { expiresIn: '1h' });
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;

    const mailOptions = {
        from: 'karthikpokharel@gmail.com',
        to: user.email,
        subject: 'Password Reset',
        text: `Please click the following link to reset your password: ${resetUrl}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending email', error });
        }
        res.json({ message: 'Password reset link sent to your email' });
    });
});

router.get('/reset-password', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, 'secretKey');
        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            console.error('Invalid token: User not found');
            return res.status(400).json({ message: 'Invalid token: User not found' });
        }

        // Render your Angular reset password form HTML here
        // For example, if using EJS:
        res.render('reset-password', { token }); // Assuming 'reset-password' is your view name

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(400).json({ message: 'Invalid or expired token', error });
    }
});
// Step 2: Reset Password using the token
router.post('/reset-password', async (req, res) => {
    const {  newPassword, confirmPassword } = req.body;
    const {token }=req.query;
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const decoded = jwt.verify(token, 'secretKey');
        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        user.password = newPassword;
        user.confirmPassword = confirmPassword;
        await user.save();
        
        return res.json({ message: 'Password reset successful' });
    } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired token', error });
    }
});
router.get('/users', verifyToken, async (req, res) => {
    try {
        const users = await userRegister.find();

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});
router.put('/users/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, phoneNo, mobileNo, address, email, password, confirmPassword, termCondition, role } = req.body;
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedconfirmPassword = await bcrypt.hash(confirmPassword, 10);
  
      const updatedUser = await userRegister.findByIdAndUpdate(
        id,
        {
          firstName,
          lastName,
          phoneNo,
          mobileNo,
          address,
          email,
          password: hashedPassword,
          confirmPassword: hashedconfirmPassword,
          termCondition,
          role
        },
        { new: true }
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      return res.status(200).json(updatedUser);
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  });
  
  // Delete User
  router.delete('/delUsers/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const deletedUser = await userRegister.findByIdAndDelete(id);
  
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  });
module.exports = router;