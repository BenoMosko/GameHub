const usersModel = require('../models/usersModel');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. Get all users
const getUsers = async () => {
    try {
        const users = await usersModel.find({});
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return Promise.reject(new Error('Failed to fetch users'));
    }
};

// 2. Get user by id
const getUserById = async (id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid user ID format');
        }
        const user = await usersModel.findById(id);
        if (!user) {
            throw new Error('User not found');
        } else {
            return user;
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        return Promise.reject(new Error('Failed to fetch user'));
    }
}

// 3. Add user
const addUser = async (userObject) => {
    try {
        let password = userObject.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let user = new usersModel({
            name: userObject.name,
            username: userObject.username,
            email: userObject.email,
            password: hashedPassword,
            role: userObject.role,
            gender: userObject.gender // Added gender field
        });
        await user.save();
        return user;
    } catch (error) {
        if (error.code === 11000 && error.keyValue.hasOwnProperty('username')) {
            throw new Error('username already exists');
        } else if (error.code === 11000 && error.keyValue.hasOwnProperty('email')) {
            throw new Error('email already exists');
        } else {
            throw (error);
        }
    }
}

// 4. Update user
const updateUser = async (id, userObject) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid user ID format');
        }

        // If password is being updated, hash it
        if (userObject.password) {
            const salt = await bcrypt.genSalt(10);
            userObject.password = await bcrypt.hash(userObject.password, salt);
        }

        const updatedUser = await usersModel.findByIdAndUpdate(id, userObject, { new: true, runValidators: true });
        if (!updatedUser) {
            throw new Error('User not found');
        }
        return updatedUser;
    } catch (error) {
        console.error('Error updating user by ID:', error.message);
        throw new Error('Failed to update user by ID');
    }
}

// 5. Delete user
const deleteUser = async (id) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid user ID format');
        }
        const deletedUser = await usersModel.findByIdAndDelete(id);
        return deletedUser;
    } catch (error) {
        console.error('Error deleting user by ID:', error.message);
        throw new Error('Failed to delete user by ID');
    }
}

// 6. Get user by email
const getUserByEmail = async (email) => {
    try {
        const user = await usersModel.findOne({ email });
        return user;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw new Error('Failed to fetch user');
    }
}

// 7. Set reset password token and expiration
const setResetPasswordToken = async (email, token, expires) => {
    try {
        const user = await usersModel.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = expires;
        await user.save();
        return user;
    } catch (error) {
        console.error('Error setting reset password token:', error);
        throw new Error('Failed to set reset password token');
    }
}

// 8. Clear expired tokens
const clearExpiredTokens = async (now) => {
    try {
        await usersModel.updateMany(
            { tokenExpiration: { $lt: now } },
            { $set: { token: null, tokenExpiration: null } }
        );
    } catch (error) {
        console.error('Error clearing expired tokens:', error);
        throw error;
    }
};

// 9. User logout
const userLogout = async (email) => {
    try {
        const user = await usersModel.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        user.token = null;
        user.tokenExpiration = null;
        await user.save();
        return user;
    } catch (error) {
        console.error('Error clearing user token:', error);
        throw new Error('Failed to clear user token');
    }
};

// 10. Get user by reset password token
const getUserByResetToken = async (token) => {
    try {
        const user = await usersModel.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        return user;
    } catch (error) {
        console.error('Error finding user by reset token:', error);
        throw new Error('Failed to find user by reset token');
    }
};

// 11. Reset user password and clear reset token
const resetUserPassword = async (userId, hashedPassword) => {
    try {
        const user = await usersModel.findByIdAndUpdate(
            userId,
            {
                password: hashedPassword,
                resetPasswordToken: undefined,
                resetPasswordExpires: undefined
            },
            { new: true }
        );
        return user;
    } catch (error) {
        console.error('Error resetting user password:', error);
        throw new Error('Failed to reset user password');
    }
};

module.exports = {
    getUsers,
    getUserById,
    addUser,
    updateUser,
    deleteUser,
    getUserByEmail,
    setResetPasswordToken,
    getUserByResetToken,
    resetUserPassword,
    clearExpiredTokens,
    userLogout
};