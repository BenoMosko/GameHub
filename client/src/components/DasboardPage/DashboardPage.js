import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/DashboardPage/DashboardPage.css';

function DashboardPage() {
    const navigate = useNavigate();
    const email = sessionStorage.getItem('email');
    const role = sessionStorage.getItem('role');

    return (
        <div className="dashboard-page">
            <h1 className="dashboard-title">COMMANDER DASHBOARD</h1>
            <div className="dashboard-grid">

                {/* Intel Card */}
                <div className="dashboard-card" onClick={() => navigate('/news')}>
                    <div className="card-header">INTELLIGENCE</div>
                    <div className="card-body">
                        <div className="card-icon">📡</div>
                        <p>ACCESS LATEST GLOBAL BRIEFINGS AND TIBERIUM REPORTS.</p>
                    </div>
                    <div className="card-footer">STATUS: ACTIVE</div>
                </div>

                {/* Comms Card */}
                <div className="dashboard-card" onClick={() => navigate('/chat')}>
                    <div className="card-header">SECURE COMMS</div>
                    <div className="card-body">
                        <div className="card-icon">💬</div>
                        <p>ENCRYPTED CHANNELS FOR COMMANDER COMMUNICATIONS.</p>
                    </div>
                    <div className="card-footer">STATUS: ONLINE</div>
                </div>

                {/* Games Hub Card */}
                <div className="dashboard-card" onClick={() => navigate('/games')}>
                    <div className="card-header">GAMES HUB</div>
                    <div className="card-body">
                        <div className="card-icon">🕹️</div>
                        <p>ACCESS TACTICAL SIMULATIONS AND TRAINING MODULES.</p>
                    </div>
                    <div className="card-footer">STATUS: ONLINE</div>
                </div>



                {/* Profile Card */}
                <div className="dashboard-card profile-card" onClick={() => navigate('/profile')}>
                    <div className="card-header">COMMANDER PROFILE</div>
                    <div className="card-body">
                        <div className="card-icon">👤</div>
                        <p>DESIGNATION: {email?.split('@')[0].toUpperCase()}</p>
                        <p>AUTH LEVEL: {role === 'admin' ? 'LEVEL 5 (ADMIN)' : 'STANDARD'}</p>
                    </div>
                    <div className="card-footer">CLEARANCE: GRANTED</div>
                </div>

                {/* Admin Access Card - Conditionally Rendered */}
                {role === 'admin' && (
                    <div className="dashboard-card admin-card" onClick={() => navigate('/admin-dashboard')} style={{ borderColor: '#ef4444' }}>
                        <div className="card-header">ADMIN UPLINK</div>
                        <div className="card-body">
                            <div className="card-icon">🔐</div>
                            <p>ACCESS CLASSIFIED ADMIN PROTOCOLS AND SYSTEM CONTROLS.</p>
                        </div>
                        <div className="card-footer">STATUS: UNLOCKED</div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;