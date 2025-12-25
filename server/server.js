const express = require('express');
const cors = require('cors');
const usersRoute = require('./routes/users/usersRoute');
const newsRoute = require('./routes/news/newsRoute');
const chatRoute = require('./routes/chat/chatRoute');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);

// Init Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for production simplicity, or set to process.env.CLIENT_URL
        methods: ["GET", "POST"]
    }
});

// Load Socket Manager
require('./socket/socketManager')(io);

const connectDB = require('./config/db');
const port = process.env.PORT || 8200;

app.use(express.json({ extended: false }));
app.use(cors());

connectDB();
require('./config/db');

app.use('/api/users', usersRoute);
app.use('/api/news', newsRoute);
app.use('/api/chat', chatRoute);

// Test Route
app.post('/test', (req, res) => {
    console.log(req.body);
    res.send('Received');
});

// Start Server
server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});