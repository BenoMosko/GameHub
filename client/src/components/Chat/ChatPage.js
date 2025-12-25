import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import '../../css/Chat/ChatPage.css';

const ENDPOINT = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8200';

function ChatPage() {
    const [socket, setSocket] = useState(null);
    const [chatHistory, setChatHistory] = useState({}); // { roomName: [messages] }
    const [textMsg, setTextMsg] = useState('');
    const [room, setRoom] = useState('Global Command');
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [status, setStatus] = useState('CONNECTING...');

    const [notification, setNotification] = useState(null);
    const [pmChannels, setPmChannels] = useState([]); // Track active PMs

    // Auth info
    const username = sessionStorage.getItem('email')?.split('@')[0] || 'Unknown';
    const email = sessionStorage.getItem('email');
    const role = sessionStorage.getItem('role');

    // Ref for cleanup and room tracking
    const roomRef = useRef(room);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Update Ref when state changes
    useEffect(() => {
        roomRef.current = room;

        // Fetch history for the new room
        const fetchHistory = async () => {
            try {
                const encodedRoom = encodeURIComponent(room);
                const res = await axios.get(`${ENDPOINT}/api/chat/history/${encodedRoom}`);
                const historyMessages = res.data;

                setChatHistory(prev => ({
                    ...prev,
                    [room]: historyMessages  // Replace/Set history from DB
                }));
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };

        if (room) { // Ensure room is set
            fetchHistory();
        }

    }, [room]);

    // Fetch Rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await axios.get(`${ENDPOINT}/api/chat/rooms`);
                // Filter rooms based on role
                const visibleRooms = res.data.filter(r => {
                    if (r.type === 'admin-only') {
                        return role === 'admin';
                    }
                    return true;
                });

                const roomNames = visibleRooms.map(r => r.name);

                if (roomNames.length > 0) {
                    setRooms(roomNames);
                } else {
                    setRooms(['Global Command']);
                }
            } catch (err) {
                console.error("Failed to fetch rooms");
                setRooms(['Global Command']);
            }
        };

        const fetchActivePMs = async () => {
            try {
                if (!username) return;
                const res = await axios.get(`${ENDPOINT}/api/chat/pms/${username}`);
                setPmChannels(res.data);
            } catch (err) {
                console.error("Failed to fetch active PMs");
            }
        };

        fetchRooms();
        fetchActivePMs();
    }, [username]);

    // Scroll on active room message change
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, room]);

    // State for my avatar
    const [myAvatar, setMyAvatar] = useState('');
    const [userCache, setUserCache] = useState({}); // Username -> Full User Object (Avatar, Bio, Name, etc.)

    // Modal State
    const [selectedUser, setSelectedUser] = useState(null); // The user object we are inspecting
    const [modalView, setModalView] = useState('MENU'); // 'MENU', 'INFO', 'SCAN'

    useEffect(() => {
        // Fetch full profile and ALL users for cache
        const getProfileAndUsers = async () => {
            try {
                if (!email) return;
                const res = await axios.get(`${ENDPOINT}/api/users/`);

                // 1. Find Me
                const me = res.data.find(u => u.email === email);
                if (me && me.avatar) {
                    setMyAvatar(me.avatar);
                }

                // 2. Build User Cache
                const cache = {};
                res.data.forEach(u => {
                    if (u.username) {
                        cache[u.username] = u;
                    }
                });
                setUserCache(cache);

            } catch (e) { console.error("Profile/User fetch error", e); }
        };
        getProfileAndUsers();
    }, [email]);

    useEffect(() => {
        const newSocket = io(ENDPOINT);
        setSocket(newSocket);
        setStatus('ESTABLISHING UPLINK...');

        newSocket.on('connect', () => {
            setStatus('UPLINK ESTABLISHED');
            // Send avatar on join
            newSocket.emit('join_server', { username, email, role, avatar: myAvatar });
            newSocket.emit('join_room', roomRef.current);
        });

        newSocket.on('receive_message', (msg) => {
            // Update history for the specific room
            setChatHistory(prev => {
                const roomMsgs = prev[msg.room] || [];
                return { ...prev, [msg.room]: [...roomMsgs, msg] };
            });

            // Notification logic
            if (msg.room !== roomRef.current) {
                if (msg.room.startsWith('PM: ')) {
                    const sender = msg.author;
                    setNotification({
                        text: `INCOMING TERMINAL SIGNAL FROM ${sender}`,
                        room: msg.room
                    });

                    setPmChannels(prev => {
                        if (!prev.includes(msg.room)) return [...prev, msg.room];
                        return prev;
                    });
                }
            }
        });

        newSocket.on('system_message', (msg) => {
            // System messages should now include 'room' property
            // Fallback to current room if not provided (legacy)
            const targetRoom = msg.room || roomRef.current;

            setChatHistory(prev => {
                const roomMsgs = prev[targetRoom] || [];
                // Check for duplicates if needed, or just append
                return { ...prev, [targetRoom]: [...roomMsgs, { ...msg, author: 'SYSTEM', isSystem: true }] };
            });
        });

        newSocket.on('active_users', (usersList) => {
            setUsers(usersList);
        });

        newSocket.on('kicked', () => {
            alert('YOU HAVE BEEN DISCHARGED BY COMMAND AUTHORITY.');
            window.location.href = '/dashboard';
        });

        newSocket.on('message_deleted', (deletedId) => {
            // We need to find which room the message belongs to, or filter ALL rooms
            // Ideally backend sends room, but scanning all is safe enough for now
            setChatHistory(prev => {
                const newHistory = { ...prev };
                Object.keys(newHistory).forEach(r => {
                    // Filter out by either id OR _id matches
                    newHistory[r] = newHistory[r].filter(m => m.id !== deletedId && m._id !== deletedId);
                });
                return newHistory;
            });
        });

        newSocket.on('private_chat_started', ({ roomName }) => {
            setRoom(roomName);
            // Add to active PM channels
            setPmChannels(prev => {
                if (!prev.includes(roomName)) return [...prev, roomName];
                return prev;
            });
            // History remains
        });

        return () => newSocket.close();
    }, [username, email]);

    const joinRoom = (newRoom) => {
        if (socket && room !== newRoom) {
            socket.emit('leave_room', room);
            setRoom(newRoom);
            // Do NOT clear messages; history is preserved in chatHistory
            socket.emit('join_room', newRoom);
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

    const deleteMessage = (msgId) => {
        if (socket) {
            socket.emit('delete_message', { messageId: msgId, room });
        }
    };

    const kickUser = (targetId) => {
        if (socket) {
            socket.emit('kick_user', targetId);
            setSelectedUser(null); // Close modal
        }
    };

    const startPrivateChat = (targetUser) => {
        if (targetUser.username === username) return;
        if (socket) {
            socket.emit('initiate_private_chat', { targetUsername: targetUser.username });
            setSelectedUser(null); // Close modal
        }
    };

    const closePrivateChat = (e, pmName) => {
        e.stopPropagation(); // Prevent joining room when clicking close
        setPmChannels(prev => prev.filter(c => c !== pmName));
        if (room === pmName) {
            joinRoom('Global Command');
        }
    };

    // Handle User Click
    const handleUserClick = (u) => {
        const fullUser = userCache[u.username] || u;
        setSelectedUser(fullUser);
        setModalView('MENU');
    };

    // Get messages for current room
    const currentMessages = chatHistory[room] || [];

    return (
        <div className="chat-page">
            <h1 className="chat-title">COMMS ARRAY // {room.toUpperCase()}</h1>

            <div className="chat-container">
                {/* Channels Sidebar */}
                <div className="channels-sidebar">
                    <div className="sidebar-header">FREQUENCIES</div>
                    {rooms.map(r => (
                        <div
                            key={r}
                            className={`channel-item ${room === r ? 'active' : ''}`}
                            onClick={() => joinRoom(r)}
                        >
                            {room === r ? '►' : ''} {r.toUpperCase()}
                        </div>
                    ))}

                    {/* Active PM Channels */}
                    {pmChannels.length > 0 && (
                        <>
                            <div className="sidebar-header" style={{ marginTop: '2rem' }}>SECURE CHANNELS</div>
                            {pmChannels.map(pm => {
                                // Extract other user name for display
                                const parts = pm.replace('PM: ', '').split(' & ');
                                const otherUser = parts.find(p => p !== username) || 'Unknown';
                                // Try to find online user meta for avatar, OR fallback to cache
                                const activeMeta = users.find(u => u.username === otherUser);
                                const avatarUrl = activeMeta ? activeMeta.avatar : (userCache[otherUser]?.avatar || '');

                                return (
                                    <div
                                        key={pm}
                                        className={`channel-item ${room === pm ? 'active' : ''}`}
                                        onClick={() => joinRoom(pm)}
                                        style={{ color: '#4ade80', borderColor: '#4ade80', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between', paddingRight: '5px' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #4ade80', background: '#000', flexShrink: 0 }}>
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6b7280' }}>?</div>
                                                )}
                                            </div>
                                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {room === pm ? '► ' : ''}{otherUser.toUpperCase()}
                                            </div>
                                        </div>

                                        {/* Close Button */}
                                        <button
                                            onClick={(e) => closePrivateChat(e, pm)}
                                            title="Close Channel"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                padding: '0 4px',
                                                fontWeight: 'bold'
                                            }}
                                            className="btn-close-pm"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                );
                            })}
                        </>
                    )}

                    <div className="sidebar-header" style={{ marginTop: '2rem' }}>ACTIVE UNITS</div>
                    <div className="users-list">
                        {users.map(u => (
                            <div
                                key={u.id}
                                className="user-item"
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px' }}
                                title={u.username === username ? "This is you" : "Click for Options"}
                                onClick={() => handleUserClick(u)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {/* User Avatar */}
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #4ade80', background: '#000' }}>
                                        {u.avatar ? (
                                            <img src={u.avatar} alt="Av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#6b7280' }}>?</div>
                                        )}
                                    </div>
                                    <span>{u.username === username ? '★ ' : ''}{u.username}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-main">
                    <div className="chat-status-bar">
                        STATUS: <span style={{ color: status === 'UPLINK ESTABLISHED' ? '#4ade80' : '#ef4444' }}>{status}</span>
                    </div>

                    {/* Notification Banner */}
                    {notification && (
                        <div className="pm-notification" style={{
                            background: '#7f1d1d', color: '#fff', padding: '10px',
                            borderBottom: '1px solid #ef4444', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center',
                            animation: 'fadeIn 0.5s'
                        }}>
                            <span>⚠ {notification.text}</span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => {
                                    joinRoom(notification.room);
                                    setNotification(null);
                                }} style={{ background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', padding: '2px 8px', fontFamily: 'inherit' }}>
                                    ACCEPT LINK
                                </button>
                                <button onClick={() => setNotification(null)} style={{ background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '2px 8px', fontFamily: 'inherit' }}>
                                    DISMISS
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="messages-feed">
                        {currentMessages.map((msg, index) => {
                            // Determine avatar: Msg > Cache > Placeholder
                            const displayAvatar = msg.avatar || userCache[msg.author]?.avatar || '';

                            return (
                                <div
                                    key={index}
                                    className={`message-bubble ${msg.author === username ? 'start' : 'others'} ${msg.isSystem ? 'system' : ''}`}
                                >
                                    {!msg.isSystem && (
                                        <div className="msg-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                                {/* Avatar Display - Clickable */}
                                                <div
                                                    onClick={() => handleUserClick(userCache[msg.author] || { username: msg.author, avatar: msg.avatar })}
                                                    style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #ef4444', background: '#000', flexShrink: 0, cursor: 'pointer' }}
                                                    title="Open Unit Options"
                                                >
                                                    {displayAvatar ? (
                                                        <img src={displayAvatar} alt="Av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#6b7280' }}>?</div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span
                                                        className="msg-author"
                                                        style={{ fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'all 0.2s' }}
                                                        onClick={() => handleUserClick(userCache[msg.author] || { username: msg.author, avatar: msg.avatar })}
                                                        onMouseOver={(e) => e.currentTarget.style.textDecorationColor = '#4ade80'}
                                                        onMouseOut={(e) => e.currentTarget.style.textDecorationColor = 'transparent'}
                                                    >
                                                        {msg.author}
                                                    </span>
                                                    <span className="msg-time" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                            {/* Delete Button: Authored by user OR User is Admin */}
                                            {(msg.author === username || role === 'admin') && (
                                                <button
                                                    className="btn-delete-msg"
                                                    onClick={() => deleteMessage(msg.id || msg._id)}
                                                    title="Delete Transmission"
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', marginLeft: 'auto' }}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    <div className="msg-content">
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="message-input-area" onSubmit={sendMessage}>
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="TRANSMIT MESSAGE..."
                            value={textMsg}
                            onChange={(e) => setTextMsg(e.target.value)}
                        />
                        <button type="submit" className="btn-send">SEND</button>
                    </form>
                </div>
            </div>

            {/* USER CONTROL MODAL */}
            {selectedUser && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)'
                }} onClick={() => setSelectedUser(null)}>

                    <div className="modal-content" style={{
                        background: '#111827', border: '2px solid #4ade80',
                        padding: '2rem', width: '400px', maxWidth: '90%',
                        boxShadow: '0 0 30px rgba(74, 222, 128, 0.2)',
                        textAlign: 'center', color: '#e5e7eb', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>

                        <button onClick={() => setSelectedUser(null)} style={{
                            position: 'absolute', top: '10px', right: '15px',
                            background: 'transparent', border: 'none', color: '#ef4444',
                            fontSize: '1.5rem', cursor: 'pointer'
                        }}>✕</button>

                        <h2 style={{ fontFamily: 'Orbitron, sans-serif', color: '#4ade80', borderBottom: '1px solid #374151', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            UNIT IDENTIFIED: {selectedUser.username.toUpperCase()}
                        </h2>

                        {/* VIEW: MENU */}
                        {modalView === 'MENU' && (
                            <>
                                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid #4ade80', overflow: 'hidden' }}>
                                        {selectedUser.avatar ? (
                                            <img src={selectedUser.avatar} alt="Av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>?</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <button className="btn-modal-action" onClick={() => startPrivateChat(selectedUser)} style={{ background: '#064e3b', color: '#4ade80', padding: '10px', border: '1px solid #4ade80', cursor: 'pointer', fontFamily: 'Orbitron' }}>
                                        OPEN SECURE CHANNEL
                                    </button>
                                    <button className="btn-modal-action" onClick={() => setModalView('SCAN')} style={{ background: '#1e293b', color: '#60a5fa', padding: '10px', border: '1px solid #60a5fa', cursor: 'pointer', fontFamily: 'Orbitron' }}>
                                        VISUAL SCAN
                                    </button>
                                    <button className="btn-modal-action" onClick={() => setModalView('INFO')} style={{ background: '#374151', color: '#d1d5db', padding: '10px', border: '1px solid #9ca3af', cursor: 'pointer', fontFamily: 'Orbitron' }}>
                                        PERSONNEL FILE
                                    </button>

                                    {/* Admin Only */}
                                    {role === 'admin' && selectedUser.username !== username && (
                                        <button className="btn-modal-action" onClick={() => kickUser(selectedUser.id || selectedUser._id)} style={{ background: '#7f1d1d', color: '#fca5a5', padding: '10px', border: '1px solid #ef4444', cursor: 'pointer', fontFamily: 'Orbitron' }}>
                                            DISHONORABLE DISCHARGE
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* VIEW: SCAN (BIG AVATAR) */}
                        {modalView === 'SCAN' && (
                            <div>
                                <div style={{ width: '300px', height: '300px', margin: '0 auto', border: '2px solid #60a5fa', overflow: 'hidden' }}>
                                    {selectedUser.avatar ? (
                                        <img src={selectedUser.avatar} alt="Large" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>NO VISUAL DATA</div>
                                    )}
                                </div>
                                <button onClick={() => setModalView('MENU')} style={{ marginTop: '1rem', background: 'transparent', color: '#60a5fa', border: '1px solid #60a5fa', padding: '5px 20px', cursor: 'pointer' }}>
                                    RETURN
                                </button>
                            </div>
                        )}

                        {/* VIEW: INFO */}
                        {modalView === 'INFO' && (
                            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '1rem', border: '1px solid #374151' }}>
                                <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#9ca3af' }}>NAME:</strong> {selectedUser.name || 'CLASSIFIED'}</p>
                                <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#9ca3af' }}>CALLSIGN:</strong> {selectedUser.username}</p>
                                <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#9ca3af' }}>GENDER:</strong> {selectedUser.gender ? selectedUser.gender.toUpperCase() : 'UNKNOWN'}</p>
                                <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#9ca3af' }}>EMAIL UPLINK:</strong> {selectedUser.email}</p>
                                <p style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#9ca3af' }}>BIO:</strong></p>
                                <p style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.5)', borderRadius: '4px', fontStyle: 'italic', color: '#d1d5db' }}>
                                    {selectedUser.bio || "NO SERVICE RECORD AVAILABLE."}
                                </p>
                                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    <button onClick={() => setModalView('MENU')} style={{ background: 'transparent', color: '#9ca3af', border: '1px solid #9ca3af', padding: '5px 20px', cursor: 'pointer' }}>
                                        RETURN
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )
            }
        </div >
    );
}

export default ChatPage;
