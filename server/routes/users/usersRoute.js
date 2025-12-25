const express = require('express');
const usersBL = require('../../models/usersBL');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// 1. Get all users
router.get('/', async (request, response) => {
    try {
        const data = await usersBL.getUsers();
        return response.json(data);
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Error fetching users' });
    }
});

// 2. Get user by id
router.get('/:id', async (request, response) => {
    try {
        const id = request.params.id;
        const user = await usersBL.getUserById(id);
        return response.json(user);
    } catch (error) {
        return response.status(500).json({ message: 'Error fetching user' });
    }
});

// 4. Update user
router.put('/:id', async (request, response) => {
    try {
        const id = request.params.id;
        const updateData = request.body;
        const updatedUser = await usersBL.updateUser(id, updateData);
        return response.json(updatedUser);
    } catch (error) {
        console.error('Error in /:id PUT route:', error.message);
        return response.status(500).json({ message: error.message });
    }
});

// 5. Delete user
router.delete('/:id', async (request, response) => {
    try {
        const id = request.params.id;
        const deletedUser = await usersBL.deleteUser(id);
        return response.json(deletedUser);
    } catch (error) {
        console.error('Error in /:id DELETE route:', error.message);
        return response.status(500).json({ message: error.message });
    }
});

// 6. Register user
router.post('/register', async (request, response) => {
    try {
        const newUser = request.body;
        const createdUser = await usersBL.addUser(newUser);
        console.log(`User created successfully: ${createdUser}`);
        return response.status(201).json(createdUser);
    } catch (error) {
        if (error.message.startsWith('username already exist')) {
            return response.status(400).json({ message: 'username already exists' });
        } else if (error.message.startsWith('email already exist')) {
            return response.status(400).json({ message: 'email already exists' });
        } else {
            console.error('Registration error:', error.message);
            return response.status(500).json({ message: 'Server error' });
        }
    }
});

// 7. User login
router.post('/login', async (request, response) => {
    const { email, password } = request.body;
    const user = await usersBL.getUserByEmail(email);
    if (!user) {
        return response.status(400).json({ message: 'Invalid credentials' });
    }
    try {
        const matchPasswords = await bcrypt.compare(password, user.password);
        if (!matchPasswords) {
            return response.status(400).json({ message: 'Invalid credentials' });
        }
        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600 },
            async (err, token) => {
                if (err) {
                    throw err;
                }
                user.token = token;
                user.tokenExpiration = Date.now() + 3600 * 1000; // 1 hour from now
                await user.save();
                return response.json({ token, role: user.role });
            }
        );
    } catch (error) {
        console.error('Error logging in:', error.message);
        return response.status(500).json({ message: 'Server error' });
    }
});

// 8. User logout
router.post('/logout', async (request, response) => {
    const email = request.body.email;
    try {
        const user = await usersBL.userLogout(email);
        return response.json({ message: 'User logged out successfully' });
    } catch (error) {
        console.error('Error logging out:', error);
        return response.status(500).json({ message: 'Failed to log out' });
    }
});

// 9. Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await usersBL.getUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'No user with that email' });
        }
        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour

        // Use BL to set token and expiration
        await usersBL.setResetPasswordToken(email, token, expires);

        // For development, log the reset link instead of sending email
        const resetUrl = `http://localhost:3000/reset-password/${token}`;
        
        console.log('=== PASSWORD RESET LINK ===');
        console.log(`Email: ${email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log('=========================');

        // Optional: Send email if properly configured
        // Only attempt to send email if environment variables are set
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                const transporter = nodemailer.createTransporter({
                    service: 'Gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                
                const mailOptions = {
                    to: user.email,
                    from: process.env.EMAIL_USER,
                    subject: 'Password Reset Request',
                    html: `
                        <h2>Password Reset Request</h2>
                        <p>You requested a password reset for your account.</p>
                        <p>Click the link below to reset your password:</p>
                        <a href="${resetUrl}">Reset Password</a>
                        <p>This link will expire in 1 hour.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                    `
                };

                await transporter.sendMail(mailOptions);
                console.log('Reset email sent successfully');
            } else {
                console.log('Email not configured - using console output only');
            }
        } catch (emailError) {
            console.log('Email sending failed (continuing anyway):', emailError.message);
        }

        res.status(200).json({ 
            message: 'Password reset link sent to your email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error sending password reset email' });
    }
});

// 10. Reset Password Route
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ message: 'New password is required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        // Find user with valid reset token
        const user = await usersBL.getUserByResetToken(token);
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Check if token has expired
        if (user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user password and clear reset token
        await usersBL.resetUserPassword(user._id, hashedPassword);

        res.status(200).json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

module.exports = router;