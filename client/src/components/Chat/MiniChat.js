import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import '../../css/Chat/MiniChat.css';

const ENDPOINT = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8200';

function MiniChat() {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [textMsg, setTextMsg] = useState('');
    const [status, setStatus] = useState('CONNECTING...');
    const [room, setRoom] = useState('Global Command');
    const [view, setView] = useState('CHAT'); // 'CHAT', 'CHANNELS', 'USERS'

    // Data
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [pmChannels, setPmChannels] = useState([]);
    const [userCache, setUserCache] = useState({});

    const messagesEndRef = useRef(null);

    // Auth info
    const username = sessionStorage.getItem('email')?.split('@')[0] || 'Unknown';
    const email = sessionStorage.getItem('email');
    const role = sessionStorage.getItem('role');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (view === 'CHAT') scrollToBottom();
    }, [messages, view]);

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                // User Cache
                const userRes = await axios.get(`${ENDPOINT}/api/users/`);
                const cache = {};
                userRes.data.forEach(u => cache[u.username] = u);
                setUserCache(cache);

                // Rooms
                const roomRes = await axios.get(`${ENDPOINT}/api/chat/rooms`);
                setRooms(roomRes.data.map(r => r.name));

                // PMs
                const pmRes = await axios.get(`${ENDPOINT}/api/chat/pms/${username}`);
                setPmChannels(pmRes.data);
            } catch (e) { console.error("Data fetch error", e); }
        };
        fetchData();
    }, [username]);

    useEffect(() => {
        // Fetch history when room changes
        const fetchHistory = async () => {
            try {
                const encodedRoom = encodeURIComponent(room);
                const res = await axios.get(`${ENDPOINT}/api/chat/history/${encodedRoom}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, [room]);

    useEffect(() => {
        const newSocket = io(ENDPOINT);
        setSocket(newSocket);
        setStatus('LINKING...');

        newSocket.on('connect', () => {
            setStatus('ONLINE');
            const myAvatar = userCache[username]?.avatar || '';
            newSocket.emit('join_server', { username, email, role, avatar: myAvatar });
            newSocket.emit('join_room', room);
        });

        newSocket.on('receive_message', (msg) => {
            if (msg.room === room) {
                setMessages(prev => [...prev, msg]);
            }
            // If PM comes in
            if (msg.room.startsWith('PM: ') && !pmChannels.includes(msg.room)) {
                setPmChannels(prev => [...prev, msg.room]);
            }
        });

        newSocket.on('active_users', (usersList) => {
            setUsers(usersList);
        });

        newSocket.on('private_chat_started', ({ roomName }) => {
            setPmChannels(prev => {
                if (!prev.includes(roomName)) return [...prev, roomName];
                return prev;
            });
            setRoom(roomName);
            setView('CHAT');
        });

        return () => newSocket.close();
    }, [username, email, role, room, userCache, pmChannels]);

    const joinRoom = (newRoom) => {
        if (socket && room !== newRoom) {
            socket.emit('leave_room', room);
            setRoom(newRoom);
            socket.emit('join_room', newRoom);
            setView('CHAT');
        }
    };

    const startPrivateChat = (targetUser) => {
        if (targetUser === username) return;
        if (socket) {
            socket.emit('initiate_private_chat', { targetUsername: targetUser });
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (textMsg && socket) {
            const msgData = {
                room,
                author: username,
                text: textMsg,
                timestamp: new Date().toISOString()
            };
            socket.emit('send_message', msgData);
            setTextMsg('');
        }
    };

    // Hover State
    const [hoverUser, setHoverUser] = useState(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e, u) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverPos({ x: rect.right + 10, y: rect.top });
        setHoverUser(u);
    };

    const handleMouseLeave = () => {
        setHoverUser(null);
    };

    return (
        <div className="minichat-container">
            {/* Header / Tabs */}
            <div className="minichat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="status-indicator" style={{ background: status === 'ONLINE' ? '#4ade80' : '#ef4444' }}></span>
                    <span style={{ color: '#4ade80' }}>{room.length > 15 ? 'PM' : room}</span>
                </div>
                <div className="minichat-tabs">
                    <button className={view === 'CHAT' ? 'active' : ''} onClick={() => setView('CHAT')}>CHAT</button>
                    <button className={view === 'CHANNELS' ? 'active' : ''} onClick={() => setView('CHANNELS')}>CH</button>
                    <button className={view === 'USERS' ? 'active' : ''} onClick={() => setView('USERS')}>UNITS</button>
                </div>
            </div>

            {/* VIEW: CHAT */}
            {view === 'CHAT' && (
                <>
                    <div className="minichat-feed">
                        {messages.map((msg, index) => {
                            const avatar = msg.avatar || userCache[msg.author]?.avatar || '';
                            const fullUser = userCache[msg.author] || { username: msg.author };
                            return (
                                <div key={index} className="mini-message">
                                    <div
                                        className="mini-avatar"
                                        onMouseEnter={(e) => handleMouseEnter(e, fullUser)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {avatar ? <img src={avatar} alt="Av" /> : <span>?</span>}
                                    </div>
                                    <div className="mini-content">
                                        <div
                                            className="mini-author"
                                            style={{ color: msg.author === username ? '#4ade80' : '#60a5fa', cursor: 'pointer' }}
                                            onMouseEnter={(e) => handleMouseEnter(e, fullUser)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {msg.author}
                                        </div>
                                        <div className="mini-text">{msg.text}</div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                    <form className="minichat-input-area" onSubmit={sendMessage}>
                        <input
                            type="text"
                            className="minichat-input"
                            placeholder=">> TRANSMIT"
                            value={textMsg}
                            onChange={(e) => setTextMsg(e.target.value)}
                        />
                    </form>
                </>
            )}

            {/* VIEW: CHANNELS */}
            {view === 'CHANNELS' && (
                <div className="minichat-list">
                    <div className="list-header">FREQUENCIES</div>
                    {rooms.map(r => (
                        <div key={r} className={`list-item ${room === r ? 'active' : ''}`} onClick={() => joinRoom(r)}>
                            # {r}
                        </div>
                    ))}
                    {pmChannels.length > 0 && (
                        <>
                            <div className="list-header" style={{ marginTop: '1rem' }}>SECURE LINES</div>
                            {pmChannels.map(pm => {
                                const parts = pm.replace('PM: ', '').split(' & ');
                                const other = parts.find(p => p !== username) || 'Unknown';
                                return (
                                    <div key={pm} className={`list-item ${room === pm ? 'active' : ''}`} onClick={() => joinRoom(pm)}>
                                        @ {other}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )}

            {/* VIEW: USERS */}
            {view === 'USERS' && (
                <div className="minichat-list">
                    <div className="list-header">ACTIVE UNITS ({users.length})</div>
                    {users.map(u => (
                        <div
                            key={u.id}
                            className="list-item user"
                            onClick={() => startPrivateChat(u.username)}
                            onMouseEnter={(e) => handleMouseEnter(e, u)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="mini-avatar small">
                                {u.avatar ? <img src={u.avatar} alt="Av" /> : <span>?</span>}
                            </div>
                            {u.username}
                        </div>
                    ))}
                </div>
            )}

            {/* HOVER TOOLTIP */}
            {hoverUser && (
                <div className="hover-profile-card" style={{ top: hoverPos.y, left: 10 }}>
                    <div className="hover-header">UNIT: {hoverUser.username}</div>
                    <div className="hover-body">
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '5px' }}>
                            <div style={{ width: '80px', height: '80px', border: '1px solid #4ade80', background: '#000' }}>
                                {hoverUser.avatar ? (
                                    <img src={hoverUser.avatar} alt="Av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>NO IMG</div>
                                )}
                            </div>
                        </div>
                        <div><strong>GENDER:</strong> {hoverUser.gender ? hoverUser.gender.toUpperCase() : 'UNKNOWN'}</div>
                        <div><strong>BIO:</strong> {hoverUser.bio || 'No Intelligence Available'}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MiniChat;
