import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/AdminDashboardPage/AdminDashboardPage.css';

function AdminDashboardPage() {
    const navigate = useNavigate();
    const email = sessionStorage.getItem('email');

    const [activeTab, setActiveTab] = useState('users'); // 'users', 'news', 'comms'
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // --- USER MANAGEMENT STATE ---
    const [users, setUsers] = useState([]);
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', username: '', email: '', password: 'password123', role: 'user' });
    const [editingUser, setEditingUser] = useState(null);

    // --- NEWS MANAGEMENT STATE ---
    const [newsItems, setNewsItems] = useState([]);
    const [showAddNewsForm, setShowAddNewsForm] = useState(false);
    const [newNews, setNewNews] = useState({ title: '', content: '', author: 'GDI Command' });
    const [editingNews, setEditingNews] = useState(null);

    // --- COMMS MANAGEMENT STATE ---
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState({ name: '', type: 'public' });

    // Fetch Initial Data
    useEffect(() => {
        fetchUsers();
        fetchNews();
        fetchRooms();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:8200/api/users/');
            setUsers(res.data);
        } catch (err) {
            setError('Failed to load personnel database.');
        }
    };

    const fetchNews = async () => {
        try {
            const res = await axios.get('http://localhost:8200/api/news/');
            setNewsItems(res.data);
        } catch (err) {
            setError('Failed to load intelligence briefings.');
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await axios.get('http://localhost:8200/api/chat/rooms');
            setRooms(res.data);
        } catch (err) {
            setError('Failed to load comms channels.');
        }
    };

    // --- USER ACTIONS ---
    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const userPayload = { ...newUser, confirmPassword: newUser.password };
            const res = await axios.post('http://localhost:8200/api/users/register', userPayload);
            setUsers([...users, res.data]);
            setSuccessMsg('Personnel record created successfully.');
            setShowAddUserForm(false);
            setNewUser({ name: '', username: '', email: '', password: 'password123', role: 'user' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add personnel.');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('CONFIRM DELETION: Is this permanent termination?')) return;
        try {
            await axios.delete(`http://localhost:8200/api/users/${id}`);
            setUsers(users.filter(u => u._id !== id));
            setSuccessMsg('Personnel record terminated.');
        } catch (err) {
            setError('Failed to delete personnel.');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:8200/api/users/${editingUser._id}`, editingUser);
            setUsers(users.map(u => (u._id === editingUser._id ? res.data : u)));
            setEditingUser(null);
            setSuccessMsg('Personnel record updated.');
        } catch (err) {
            setError('Failed to update personnel.');
        }
    };

    // --- NEWS ACTIONS ---
    const handleAddNews = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:8200/api/news', newNews);
            setNewsItems([res.data, ...newsItems]);
            setSuccessMsg('Intelligence briefing transmitted.');
            setShowAddNewsForm(false);
            setNewNews({ title: '', content: '', author: 'GDI Command' });
        } catch (err) {
            setError('Failed to transmit briefing.');
        }
    };

    const handleDeleteNews = async (id) => {
        if (!window.confirm('CONFIRM: Purge this intelligence record?')) return;
        try {
            await axios.delete(`http://localhost:8200/api/news/${id}`);
            setNewsItems(newsItems.filter(n => n._id !== id));
            setSuccessMsg('Briefing purged.');
        } catch (err) {
            setError('Failed to delete briefing.');
        }
    };

    const handleUpdateNews = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:8200/api/news/${editingNews._id}`, editingNews);
            setNewsItems(newsItems.map(n => (n._id === editingNews._id ? res.data : n)));
            setEditingNews(null);
            setSuccessMsg('Briefing updated.');
        } catch (err) {
            setError('Failed to update briefing.');
        }
    };

    // --- COMMS ACTIONS ---
    const handleAddRoom = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:8200/api/chat/rooms', { ...newRoom, createdBy: email });
            setRooms([...rooms, res.data]);
            setSuccessMsg('Comms channel established.');
            setNewRoom({ name: '', type: 'public' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create channel.');
        }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm('CONFIRM: Decommission this frequency?')) return;
        try {
            await axios.delete(`http://localhost:8200/api/chat/rooms/${id}`);
            setRooms(rooms.filter(r => r._id !== id));
            setSuccessMsg('Channel decommissioned.');
        } catch (err) {
            setError('Failed to delete channel.');
        }
    };


    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1 className="admin-title">GLOBAL COMMAND // ADMIN UPLINK</h1>
                <div className="admin-subtitle">OPERATOR IDENTIFIED: {email}</div>
            </div>

            {error && <div className="status-error">⚠️ {error} <button onClick={() => setError(null)} style={{ float: 'right', background: 'transparent', border: 'none', color: 'inherit' }}>X</button></div>}
            {successMsg && <div className="status-success">✅ {successMsg} <button onClick={() => setSuccessMsg('')} style={{ float: 'right', background: 'transparent', border: 'none', color: 'inherit' }}>X</button></div>}

            {/* SUMMARY CARDS */}
            <div className="admin-summary-grid">
                <div className="summary-card">
                    <div className="summary-number">{users.length}</div>
                    <div className="summary-label">ACTIVE PERSONNEL</div>
                </div>
                <div className="summary-card">
                    <div className="summary-number">{newsItems.length}</div>
                    <div className="summary-label">INTEL REPORTS</div>
                </div>
                <div className="summary-card">
                    <div className="summary-number">{rooms.length}</div>
                    <div className="summary-label">COMMS CHANNELS</div>
                </div>
                <div className="summary-card" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                    <div className="summary-number">➜</div>
                    <div className="summary-label">RETURN TO DASHBOARD</div>
                </div>
            </div>

            {/* TABS */}
            <div className="admin-tabs">
                <button
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    PERSONNEL MANAGEMENT
                </button>
                <button
                    className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
                    onClick={() => setActiveTab('news')}
                >
                    INTELLIGENCE CONTROL
                </button>
                <button
                    className={`tab-btn ${activeTab === 'comms' ? 'active' : ''}`}
                    onClick={() => setActiveTab('comms')}
                >
                    COMMS & BATTLEFIELD
                </button>
            </div>

            {/* USERS TAB */}
            {activeTab === 'users' && (
                <div className="admin-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">PERSONNEL DATABASE</h2>
                        <button className="btn btn-primary" onClick={() => setShowAddUserForm(!showAddUserForm)}>
                            {showAddUserForm ? 'CANCEL RECRUITMENT' : '+ RECRUIT NEW COMMANDER'}
                        </button>
                    </div>

                    {showAddUserForm && (
                        <div className="admin-form-container">
                            <h3 style={{ color: '#ef4444', fontFamily: 'Black Ops One' }}>NEW RECRUIT REGISTRATION</h3>
                            <form onSubmit={handleAddUser}>
                                <div className="admin-input-group">
                                    <label>FULL DESIGNATION</label>
                                    <input className="admin-input" type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required placeholder="John Doe" />
                                </div>
                                <div className="admin-input-group">
                                    <label>CODENAME [USERNAME]</label>
                                    <input className="admin-input" type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required placeholder="CommanderX" />
                                </div>
                                <div className="admin-input-group">
                                    <label>EMAIL UPLINK</label>
                                    <input className="admin-input" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required placeholder="email@domain.com" />
                                </div>
                                <div className="admin-input-group">
                                    <label>SECURITY CLEARANCE</label>
                                    <select className="admin-select" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                                        <option value="user">STANDARD ACCESS</option>
                                        <option value="admin">LEVEL 5 ACCESS (ADMIN)</option>
                                    </select>
                                </div>
                                <div className="admin-input-group">
                                    <label>DEFAULT ACCESS CODE</label>
                                    <input className="admin-input" type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
                                </div>
                                <button type="submit" className="btn btn-primary">AUTHORIZE RECRUIT</button>
                            </form>
                        </div>
                    )}

                    {editingUser && (
                        <div className="admin-form-container" style={{ borderColor: '#fbbf24' }}>
                            <h3 style={{ color: '#fbbf24', fontFamily: 'Black Ops One' }}>MODIFYING PERSONNEL RECORD</h3>
                            <form onSubmit={handleUpdateUser}>
                                <div className="admin-input-group">
                                    <label>FULL DESIGNATION</label>
                                    <input className="admin-input" type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} required />
                                </div>
                                <div className="admin-input-group">
                                    <label>EMAIL UPLINK</label>
                                    <input className="admin-input" type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} required />
                                </div>
                                <div className="admin-input-group">
                                    <label>SECURITY CLEARANCE</label>
                                    <select className="admin-select" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                                        <option value="user">STANDARD ACCESS</option>
                                        <option value="admin">LEVEL 5 ACCESS (ADMIN)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary">UPDATE RECORD</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>CANCEL</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>DESIGNATION</th>
                                    <th>UPLINK</th>
                                    <th>CLEARANCE</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td style={{ color: user.role === 'admin' ? '#ef4444' : '#6ee7b7' }}>
                                            {user.role === 'admin' ? 'LEVEL 5 (ADMIN)' : 'STANDARD'}
                                        </td>
                                        <td>
                                            <button className="btn-action" onClick={() => setEditingUser(user)}>EDIT</button>
                                            <button className="btn-action btn-delete" onClick={() => handleDeleteUser(user._id)}>TERMINATE</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* NEWS TAB */}
            {activeTab === 'news' && (
                <div className="admin-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">INTELLIGENCE LOGS</h2>
                        <button className="btn btn-primary" onClick={() => setShowAddNewsForm(!showAddNewsForm)}>
                            {showAddNewsForm ? 'CANCEL TRANSMISSION' : '+ COMPOSE NEW BRIEFING'}
                        </button>
                    </div>

                    {showAddNewsForm && (
                        <div className="admin-form-container">
                            <h3 style={{ color: '#ef4444', fontFamily: 'Black Ops One' }}>OUTGOING TRANSMISSION</h3>
                            <form onSubmit={handleAddNews}>
                                <div className="admin-input-group">
                                    <label>HEADLINE</label>
                                    <input className="admin-input" type="text" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} required placeholder="URGENT: GDI MOBILIZATION" />
                                </div>
                                <div className="admin-input-group">
                                    <label>AUTHORING OFFICER</label>
                                    <input className="admin-input" type="text" value={newNews.author} onChange={(e) => setNewNews({ ...newNews, author: e.target.value })} required />
                                </div>
                                <div className="admin-input-group">
                                    <label>BRIEFING CONTENT</label>
                                    <textarea className="admin-textarea" value={newNews.content} onChange={(e) => setNewNews({ ...newNews, content: e.target.value })} required></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary">BROADCAST BRIEFING</button>
                            </form>
                        </div>
                    )}

                    {editingNews && (
                        <div className="admin-form-container" style={{ borderColor: '#fbbf24' }}>
                            <h3 style={{ color: '#fbbf24', fontFamily: 'Black Ops One' }}>REDACTING INTELLIGENCE</h3>
                            <form onSubmit={handleUpdateNews}>
                                <div className="admin-input-group">
                                    <label>HEADLINE</label>
                                    <input className="admin-input" type="text" value={editingNews.title} onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })} required />
                                </div>
                                <div className="admin-input-group">
                                    <label>AUTHORING OFFICER</label>
                                    <input className="admin-input" type="text" value={editingNews.author} onChange={(e) => setEditingNews({ ...editingNews, author: e.target.value })} required />
                                </div>
                                <div className="admin-input-group">
                                    <label>BRIEFING CONTENT</label>
                                    <textarea className="admin-textarea" value={editingNews.content} onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })} required></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="submit" className="btn btn-primary">UPDATE RECORDS</button>
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingNews(null)}>CANCEL REDACTION</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="data-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>DATE</th>
                                    <th>HEADLINE</th>
                                    <th>AUTHOR</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {newsItems.map(item => (
                                    <tr key={item._id}>
                                        <td>{new Date(item.date).toLocaleDateString()}</td>
                                        <td>{item.title}</td>
                                        <td>{item.author}</td>
                                        <td>
                                            <button className="btn-action" onClick={() => setEditingNews(item)}>REDACT</button>
                                            <button className="btn-action btn-delete" onClick={() => handleDeleteNews(item._id)}>PURGE</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* COMMS TAB */}
            {activeTab === 'comms' && (
                <div className="admin-panel">
                    <div className="panel-header">
                        <h2 className="panel-title">COMMS FREQUENCY CONTROLS</h2>
                    </div>

                    <div className="admin-form-container">
                        <h3 style={{ color: '#ef4444', fontFamily: 'Black Ops One' }}>OPEN NEW FREQUENCY</h3>
                        <form onSubmit={handleAddRoom}>
                            <div className="admin-input-group">
                                <label>FREQUENCY NAME</label>
                                <input className="admin-input" type="text" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} required placeholder="E.g. Squad Alpha" />
                            </div>
                            <div className="admin-input-group">
                                <label>SECURITY LEVEL</label>
                                <select className="admin-select" value={newRoom.type} onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}>
                                    <option value="public">PUBLIC BROADCAST</option>
                                    <option value="admin-only">COMMAND ONLY</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary">ESTABLISH CHANNEL</button>
                        </form>
                    </div>

                    <div className="data-table-container" style={{ marginTop: '2rem' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>FREQUENCY NAME</th>
                                    <th>TYPE</th>
                                    <th>ESTABLISHED</th>
                                    <th>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.map(room => (
                                    <tr key={room._id}>
                                        <td>{room.name}</td>
                                        <td style={{ color: room.type === 'admin-only' ? '#ef4444' : '#6ee7b7' }}>
                                            {room.type.toUpperCase()}
                                        </td>
                                        <td>{new Date(room.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn-action btn-delete" onClick={() => handleDeleteRoom(room._id)}>DECOMMISSION</button>
                                        </td>
                                    </tr>
                                ))}
                                {rooms.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>NO ACTIVE FREQUENCIES</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDashboardPage;