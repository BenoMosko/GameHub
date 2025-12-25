const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// Define the User schema
const usersSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'], // Added enum for gender for better data integrity
        default: 'male'
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    token: {
        type: String
    },
    tokenExpiration: {
        type: Date
    },
    // Add these fields for password reset
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});
// Create the User model from the schema
const Users = mongoose.model('Users', usersSchema);
module.exports = Users;