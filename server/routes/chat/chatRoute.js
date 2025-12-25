const express = require('express');
const router = express.Router();
const ChatRoom = require('../../models/ChatRoom');
const Message = require('../../models/Message');

// @route   GET api/chat/rooms
// @desc    Get all chat rooms
// @access  Public (Protected by frontend usually)
router.get('/rooms', async (req, res) => {
    try {
        const rooms = await ChatRoom.find().sort({ name: 1 });
        res.json(rooms);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/chat/rooms
// @desc    Create a new chat room
// @access  Private (Admin)
router.post('/rooms', async (req, res) => {
    const { name, type, createdBy } = req.body;

    try {
        let room = await ChatRoom.findOne({ name });
        if (room) {
            return res.status(400).json({ message: 'Room already exists' });
        }

        room = new ChatRoom({
            name,
            type,
            createdBy
        });

        await room.save();
        res.json(room);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/chat/rooms/:id
// @desc    Delete a chat room
// @access  Private (Admin)
router.delete('/rooms/:id', async (req, res) => {
    try {
        await ChatRoom.findByIdAndDelete(req.params.id);
        res.json({ message: 'Room deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chat/history/:room
// @desc    Get chat history for a room
// @access  Public (Protected by frontend)
router.get('/history/:room', async (req, res) => {
    try {
        const { room } = req.params;
        const decodedRoom = decodeURIComponent(room);

        const messages = await Message.find({ room: decodedRoom })
            .sort({ timestamp: 1 }) // Oldest first
            .limit(100);

        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/chat/pms/:username
// @desc    Get active PM rooms for a user
router.get('/pms/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const regex = new RegExp(`^PM: .*${username}.*`);

        const rooms = await Message.distinct('room', { room: { $regex: regex } });
        res.json(rooms);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
