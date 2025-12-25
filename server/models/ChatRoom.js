const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['public', 'private', 'admin-only'],
        default: 'public'
    },
    createdBy: {
        type: String, // User ID or Email
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
