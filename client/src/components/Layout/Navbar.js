import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../css/Layout/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = sessionStorage.getItem('email');

    const handleLogout = async () => {
        try {
            if (email) {
                await axios.post('http://localhost:8200/api/users/logout', { email });
            }
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('email');
            sessionStorage.removeItem('role');
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
            // Force logout client-side even if server fails
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('email');
            navigate('/');
        }
    };

    const isActive = (path) => {
        return location.pathname === path ? 'nav-link active' : 'nav-link';
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <span className="brand-logo">GDI/NOD</span>
                <span className="brand-text">COMMAND CENTER</span>
            </div>

            <div className="navbar-menu">
                <Link to="/dashboard" className={isActive('/dashboard')}>
                    DASHBOARD
                </Link>
                <Link to="/news" className={isActive('/news')}>
                    INTEL
                </Link>
                <Link to="/chat" className={isActive('/chat')}>
                    COMMS
                </Link>
                <Link to="/games" className={isActive('/games')}>
                    GAMES
                </Link>
                {sessionStorage.getItem('role') === 'admin' && (
                    <Link to="/admin-dashboard" className={isActive('/admin-dashboard')} style={{ color: '#fca5a5', textShadow: '0 0 5px red' }}>
                        ADMIN
                    </Link>
                )}
            </div>

            <div className="navbar-user">
                <span className="user-email">CMDR. {email?.split('@')[0].toUpperCase()}</span>
                <button onClick={handleLogout} className="btn-logout">
                    ABORT UPLINK
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
