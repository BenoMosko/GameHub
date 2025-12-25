import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../css/ProfilePage/ProfilePage.css';

function ProfilePage() {
    const [user, setUser] = useState({
        name: '',
        email: '',
        username: '',
        avatar: '',
        bio: '',
        gender: 'male',
        password: '' // Only for updates
    });
    const [avatarTheme, setAvatarTheme] = useState('mecha'); // 'mecha', 'alien', 'cyborg'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    // Ideally, we get user ID from token or session. 
    // Here we might need to fetch by email stored in session or pass ID.
    // For now, let's fetch by email since we store it in session.
    // But update requires ID. We need to implement lookup.

    // Better approach: Store userId in session on login.
    // If not, we have to fetch by email first.
    const email = sessionStorage.getItem('email');
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Determine User ID first (Hack if not in session, but we can rely on email lookup)
                // Since we don't have GetByEmail exposed easily as API (Wait, we do?)
                // API has /users/:id. We need to find our ID.

                // Fetch all users and find mine (inefficient but works for now)
                // OR better, decode the token to get ID, but token is HttpOnly or not accessible easily?
                // `sessionStorage` doesn't have ID.

                // Let's implement "Get Me" or just search by email if strictly needed.
                // We have `socket` joining with `{username, email}`.

                // Using existing API: GET /api/users/ 
                if (!email) {
                    setError("No active session found.");
                    setLoading(false);
                    return;
                }

                const res = await axios.get('http://localhost:8200/api/users/');
                const currentUser = res.data.find(u => u.email === email);

                if (currentUser) {
                    setUserId(currentUser._id);
                    setUser({
                        name: currentUser.name,
                        email: currentUser.email,
                        username: currentUser.username,
                        avatar: currentUser.avatar || '',
                        bio: currentUser.bio || '',
                        gender: currentUser.gender || 'male',
                        password: ''
                    });
                } else {
                    setError("Personnel record not found.");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to retrieve personnel file.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [email]);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess('');

        if (!userId) return;

        try {
            // Prepare payload - exclude empty password
            const payload = {
                name: user.name,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
                bio: user.bio,
                gender: user.gender // Include gender in payload
            };

            if (user.password) {
                payload.password = user.password;
            }

            const res = await axios.put(`http://localhost:8200/api/users/${userId}`, payload);

            setSuccess("PERSONNEL RECORD UPDATED SUCCESSFULLY.");
            // Update session if email changed (though usually we logout)
            if (user.email !== email) {
                sessionStorage.setItem('email', user.email);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Update failed.");
        }
    };

    const fabricateIdentity = () => {
        const seed = Math.floor(Math.random() * 1000000);
        let prompt = "";

        // Define gender string for prompt
        const genderStr = user.gender === 'female' ? 'female' : 'male';

        if (avatarTheme === 'mecha') {
            prompt = `fearsome ${genderStr} battle mech robot bust, commander, scifi, highly detailed, metal, starcraft style, dark background`;
        } else if (avatarTheme === 'alien') {
            prompt = `scary ${genderStr} alien warlord portrait, organic armor, zerg style, glowing eyes, dark background, detailed`;
        } else if (avatarTheme === 'cyborg') {
            prompt = `futuristic ${genderStr} cyborg general, half human half machine face, gritty, cyberpunk, neon lights, highly detailed`;
        }

        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=300&height=300&nologo=true&seed=${seed}`;
        setUser({ ...user, avatar: url });
    };

    if (loading) return <div className="profile-page">DECRYPTING FILE...</div>;

    return (
        <div className="profile-page">
            <div className="profile-header">
                <h1 className="profile-title">PERSONNEL FILE</h1>
                <div className="profile-subtitle">CLEARANCE CODE: {userId}</div>
            </div>

            {error && <div className="status-msg status-error">⚠️ {error}</div>}
            {success && <div className="status-msg status-success">✅ {success}</div>}

            <div className="profile-container">
                <form className="profile-form" onSubmit={handleSubmit}>

                    <div className="profile-section">
                        {/* Avatar Column */}
                        <div style={{ textAlign: 'center' }}>
                            <div className="avatar-preview">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="Profile" onError={(e) => { e.target.src = 'https://via.placeholder.com/150/000000/FFFFFF/?text=IMG_ERR' }} />
                                ) : (
                                    <div className="avatar-placeholder">?</div>
                                )}
                            </div>

                            {/* Generator Controls */}
                            <div className="avatar-generator" style={{ marginTop: '1.5rem', border: '1px solid #374151', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                                <label className="selector-label" style={{ borderBottom: '1px solid #ef4444', paddingBottom: '0.5rem', marginBottom: '1rem' }}>UNIT GENERATOR</label>

                                {/* Gender Selection */}
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', color: '#9ca3af', fontSize: '0.9rem' }}>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="male"
                                            checked={user.gender === 'male'}
                                            onChange={handleChange}
                                        /> MALE
                                    </label>
                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <input
                                            type="radio"
                                            name="gender"
                                            value="female"
                                            checked={user.gender === 'female'}
                                            onChange={handleChange}
                                        /> FEMALE
                                    </label>
                                </div>

                                {/* Theme Selection */}
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif' }}>
                                        <input
                                            type="radio"
                                            name="avatarTheme"
                                            value="mecha"
                                            checked={avatarTheme === 'mecha'}
                                            onChange={(e) => setAvatarTheme(e.target.value)}
                                        /> MECHA
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif' }}>
                                        <input
                                            type="radio"
                                            name="avatarTheme"
                                            value="alien"
                                            checked={avatarTheme === 'alien'}
                                            onChange={(e) => setAvatarTheme(e.target.value)}
                                        /> ALIEN
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif' }}>
                                        <input
                                            type="radio"
                                            name="avatarTheme"
                                            value="cyborg"
                                            checked={avatarTheme === 'cyborg'}
                                            onChange={(e) => setAvatarTheme(e.target.value)}
                                        /> CYBORG
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    className="btn-save"
                                    style={{ width: '100%', fontSize: '1rem', padding: '0.5rem', marginBottom: '1rem' }}
                                    onClick={fabricateIdentity}
                                >
                                    FABRICATE NEW PROTOTYPE
                                </button>

                                <div className="form-group">
                                    <label style={{ fontSize: '0.7rem' }}>MANUAL URL OVERRIDE</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        name="avatar"
                                        value={user.avatar}
                                        onChange={handleChange}
                                        placeholder="https://"
                                        style={{ fontSize: '0.8rem', padding: '0.4rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Details Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>FULL DESIGNATION [NAME]</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="name"
                                    value={user.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>CODENAME [USERNAME]</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="username"
                                    value={user.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>EMAIL UPLINK</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    value={user.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>UPDATE ACCESS CODE [PASSWORD]</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="password"
                                    value={user.password}
                                    onChange={handleChange}
                                    placeholder="LEAVE BLANK TO KEEP CURRENT"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>SERVICE RECORD [BIO]</label>
                        <textarea
                            className="form-textarea"
                            name="bio"
                            value={user.bio}
                            onChange={handleChange}
                            placeholder="Enter service history..."
                        ></textarea>
                    </div>

                    <button type="submit" className="btn-save">UPDATE RECORD</button>

                </form>
            </div >
        </div >
    );
}

export default ProfilePage;
