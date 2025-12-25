const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        index: true // Index for faster queries by room
    },
    author: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'system', 'image'],
        default: 'text'
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    avatar: {
        type: String,
        default: ''
    },
    id: {
        type: String,
        required: true,
        unique: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
