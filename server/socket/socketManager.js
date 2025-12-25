const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const Users = require('../models/usersModel'); // Import Users Model

module.exports = (io) => {
    // Note: Old messages without 'id' field might cause issues if not handled.
    // Ideally, we'd run a migration or wipe the collection.
    // For this dev environment, we assume new messages will work.
    const connectedUsers = {};

    io.on('connection', (socket) => {
        console.log(`[UPLINK ESTABLISHED] Socket ID: ${socket.id}`);

        // HOST JOIN
        socket.on('join_server', (userData) => {
            // IMMEDIATE SYNCHRONOUS REGISTRATION
            // This prevents race conditions with join_room which fires immediately after
            const socketId = socket.id;

            // Initialize with basic data
            connectedUsers[socketId] = {
                ...userData,
                id: socketId,
                avatar: userData.avatar || '' // Use forwarded avatar or empty
            };

            // Emit immediately so user shows up
            io.emit('active_users', Object.values(connectedUsers));
            console.log(`User connected: ${userData.username}`);

            // ASYNC ENRICHMENT (Fetch latest avatar from DB to override/fill)
            (async () => {
                try {
                    if (userData.email) {
                        const dbUser = await Users.findOne({ email: userData.email });
                        if (dbUser && dbUser.avatar) {
                            // Check if still connected
                            if (connectedUsers[socketId]) {
                                connectedUsers[socketId].avatar = dbUser.avatar;
                                // Re-broadcast updated list with Verified Avatar
                                io.emit('active_users', Object.values(connectedUsers));
                                console.log(`[AVATAR SYNCED] ${userData.username}`);
                            }
                        }
                    }
                } catch (err) {
                    console.error("Avatar sync failed:", err);
                }
            })();
        });

        // JOIN ROOM
        // JOIN ROOM
        socket.on('join_room', async (roomName) => {
            const user = connectedUsers[socket.id];
            if (!user) return; // Should not happen if connected properly

            // Check Access Control
            try {
                if (!roomName.startsWith('PM: ')) {
                    const room = await ChatRoom.findOne({ name: roomName });
                    if (room && room.type === 'admin-only') {
                        if (user.role !== 'admin') {
                            socket.emit('system_message', {
                                text: 'ACCESS DENIED: COMMAND CLEARANCE REQUIRED.',
                                type: 'error',
                                room: roomName
                            });
                            return;
                        }
                    }
                }
            } catch (err) {
                console.error("Access check failed", err);
            }

            socket.join(roomName);
            user.room = roomName;
            io.to(roomName).emit('system_message', {
                text: `${user.username} HAS ESTABLISHED UPLINK.`,
                type: 'success',
                room: roomName
            });
            // Removed redundant block below as it is now covered
        });

        // LEAVE ROOM
        socket.on('leave_room', (roomName) => {
            socket.leave(roomName);
            const user = connectedUsers[socket.id];
            if (user) {
                io.to(roomName).emit('system_message', {
                    text: `${user.username} UPLINK TERMINATED.`,
                    type: 'error'
                });
                delete user.room;
            }
        });

        // SEND MESSAGE
        // SEND MESSAGE
        socket.on('send_message', async (data) => {
            // Check for Private Message Re-connection
            if (data.room.startsWith('PM: ')) {
                const participants = data.room.replace('PM: ', '').split(' & ');
                const targetUsername = participants.find(u => u !== data.author);

                if (targetUsername) {
                    const targetSocketId = Object.keys(connectedUsers).find(
                        key => connectedUsers[key].username === targetUsername
                    );

                    if (targetSocketId) {
                        const targetSocket = io.sockets.sockets.get(targetSocketId);
                        if (targetSocket && !targetSocket.rooms.has(data.room)) {
                            targetSocket.join(data.room);
                            console.log(`[UPLINK RE-ESTABLISHED] ${targetUsername} rejoined ${data.room}`);
                        }
                    }
                }
            }

            // Get Author Avatar from connected users
            const senderUser = Object.values(connectedUsers).find(u => u.username === data.author);
            const authorAvatar = senderUser ? senderUser.avatar : '';

            // Assign unique ID to message
            const messageData = {
                ...data,
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                avatar: authorAvatar // Attach avatar to payload
            };

            // Save to Database
            try {
                const newMessage = new Message({
                    room: data.room,
                    author: data.author,
                    text: data.text,
                    timestamp: data.timestamp,
                    avatar: authorAvatar,
                    id: messageData.id // Persist the Socket ID
                });
                await newMessage.save();
            } catch (err) {
                console.error("Error saving message", err);
            }

            io.to(data.room).emit('receive_message', messageData);
        });

        // DELETE MESSAGE
        socket.on('delete_message', async (data) => {
            // data: { messageId, room }
            try {
                // Delete from DB: Check both custom 'id' (new msgs) and '_id' (legacy/history msgs)
                // We use findOneAndDelete to retrieve the doc so we know which ID to broadcast if needed, 
                // but simpler is just to broadcast the ID we received.

                // Mongoose might complain if we query _id with a non-ObjectId string, 
                // so we rely on mongoose to handle casting or just use 'id' if not ObjectId.
                // Safest approach: Try delete by 'id' first, then '_id' if valid.
                // Or use $or query.

                await Message.deleteOne({
                    $or: [
                        { id: data.messageId },
                        { _id: data.messageId } // Mongoose usually auto-casts if possible, or fails gracefullly in query
                    ]
                });

                // Broadcast deletion
                io.to(data.room).emit('message_deleted', data.messageId);
            } catch (err) {
                console.error("Error deleting message", err);
                // Try strictly as string id if _id cast failed
                try {
                    await Message.deleteOne({ id: data.messageId });
                    io.to(data.room).emit('message_deleted', data.messageId);
                } catch (e) { console.error("Retry delete failed", e); }
            }
        });

        // PRIVATE CHAT
        socket.on('initiate_private_chat', (data) => {
            const { targetUsername } = data;
            const sender = connectedUsers[socket.id];

            // Find target socket
            const targetSocketId = Object.keys(connectedUsers).find(
                key => connectedUsers[key].username === targetUsername
            );

            if (targetSocketId && sender) {
                const roomName = `PM: ${[sender.username, targetUsername].sort().join(' & ')}`;

                // Join sender
                socket.join(roomName);

                // Join target
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.join(roomName);
                    // Notify target
                    io.to(targetSocketId).emit('private_chat_started', { roomName, initiator: sender.username });
                }

                // Notify sender
                socket.emit('private_chat_started', { roomName, initiator: sender.username });
            }
        });

        // ADMIN: KICK USER
        socket.on('kick_user', (targetSocketId) => {
            const targetUser = connectedUsers[targetSocketId];
            if (targetUser) {
                // Notify room
                io.to(targetUser.room).emit('system_message', {
                    text: `${targetUser.username} HAS BEEN DISCHARGED BY COMMAND.`,
                    type: 'error'
                });

                // Notify target
                io.to(targetSocketId).emit('kicked');

                // Force disconnect (optional, or just leave room)
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.leave(targetUser.room);
                }

                // Update state
                delete connectedUsers[targetSocketId];
                io.emit('active_users', Object.values(connectedUsers));
            }
        });

        // DISCONNECT
        socket.on('disconnect', () => {
            const user = connectedUsers[socket.id];
            if (user) {
                console.log(`User disconnected: ${user.username}`);
                delete connectedUsers[socket.id];
                io.emit('active_users', Object.values(connectedUsers));
            }
        });
    });
};
