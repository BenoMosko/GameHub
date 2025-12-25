import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/LoginPage/LoginPage.css';
import '../../css/global.css';

const API_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8200';

function LoginPage() {
    const [data, setData] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [registerData, setRegisterData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [optionsExpanded, setOptionsExpanded] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const containerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const onChange = (e) => setData({ ...data, [e.target.name]: e.target.value });
    const onRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const response = await axios.post(`${API_URL}/api/users/login`, data, {
                headers: { 'Content-Type': 'application/json', 'Accept': '*/*' }
            });
            if (response.status === 200) {
                const { token, role } = response.data;
                if (token) {
                    sessionStorage.setItem('token', token);
                    sessionStorage.setItem('email', data.email);
                    sessionStorage.setItem('role', role);
                    navigate(role === 'admin' ? '/admin-dashboard' : '/dashboard');
                } else {
                    setError('Invalid login credentials');
                }
            }
        } catch (err) {
            setError('Error logging in');
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        try {
            const response = await axios.post(`${API_URL}/api/users/register`, registerData, {
                headers: { 'Content-Type': 'application/json', 'Accept': '*/*' }
            });
            if (response.status === 201) {
                setShowRegister(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error registering user');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError(null);
        setResetMessage('');

        const emailToReset = resetEmail || data.email;
        if (!emailToReset) {
            setError('Please enter your email address');
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/api/users/forgot-password`,
                { email: emailToReset },
                {
                    headers: { 'Content-Type': 'application/json', 'Accept': '*/*' }
                }
            );
            if (response.status === 200) {
                setResetMessage(`Password reset link sent to ${emailToReset}`);
                setResetEmail('');
                // Auto-close the reset form after 3 seconds
                setTimeout(() => {
                    setShowResetPassword(false);
                    setResetMessage('');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error sending password reset email');
        }
    };

    const toggleOptions = () => {
        setOptionsExpanded(!optionsExpanded);
        // Clear any reset messages when toggling options
        if (resetMessage) {
            setResetMessage('');
        }
    };

    return (
        <div className="login-page" ref={containerRef}>
            <div className='login-container'>
                {showResetPassword ? (
                    <>
                        <h2 className="form-header">Security Override</h2>
                        <p className="form-description">
                            ENTER COMM ID TO INITIATE CREDENTIAL RESET SEQUENCE.
                        </p>
                        <form className="reset-form" onSubmit={handleForgotPassword}>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="email"
                                    name="resetEmail"
                                    placeholder="COMM ID [EMAIL]"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button className="btn btn-primary" type="submit">
                                    TRANSMIT CODES
                                </button>
                            </div>
                        </form>
                        {error && (
                            <div className="alert alert-error" role="alert">
                                ⚠️ {error}
                            </div>
                        )}
                        {resetMessage && (
                            <div className="alert alert-success" role="alert">
                                <div className="alert-content">
                                    <i className="alert-icon"></i>
                                    <span className="alert-message">{resetMessage}</span>
                                </div>
                            </div>
                        )}
                        <div className="form-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowResetPassword(false);
                                    setResetEmail('');
                                    setResetMessage('');
                                    setError(null);
                                }}
                            >
                                ABORT SEQUENCE
                            </button>
                        </div>
                    </>
                ) : showRegister ? (
                    <>
                        <h2 className="form-header">New Commander</h2>
                        <form className="register-form" onSubmit={handleRegisterSubmit}>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="name"
                                    placeholder="FULL DESIGNATION"
                                    value={registerData.name}
                                    onChange={onRegisterChange}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="username"
                                    placeholder="CODENAME [USERNAME]"
                                    value={registerData.username}
                                    onChange={onRegisterChange}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="email"
                                    name="email"
                                    placeholder="COMM ID [EMAIL]"
                                    value={registerData.email}
                                    onChange={onRegisterChange}
                                    autoComplete="email"
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="password"
                                    placeholder="SECURITY CODE"
                                    value={registerData.password}
                                    onChange={onRegisterChange}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="CONFIRM CODE"
                                    value={registerData.confirmPassword}
                                    onChange={onRegisterChange}
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button className="btn btn-primary" type="submit">
                                    ESTABLISH PROFILE
                                </button>
                            </div>
                        </form>
                        {error && (
                            <div className="alert alert-error" role="alert">
                                🚫 {error}
                            </div>
                        )}
                        <div className="form-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowRegister(false)}
                            >
                                CANCEL REGISTRATION
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="form-header">Auth Uplink</h2>
                        <form className="login-form" onSubmit={handleLogin}>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="text"
                                    name="email"
                                    placeholder="COMM ID [EMAIL]"
                                    value={data.email}
                                    onChange={onChange}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            <div className='form-group'>
                                <input
                                    className="form-input"
                                    type="password"
                                    name="password"
                                    placeholder="SECURITY CODE"
                                    value={data.password}
                                    onChange={onChange}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                            <div className='form-actions'>
                                <button className="btn btn-primary" type="submit">
                                    INITIATE UPLINK
                                </button>
                            </div>
                        </form>
                        {error && (
                            <div className="alert alert-error" role="alert">
                                ⚠️ {error}
                            </div>
                        )}
                        <div className="additional-options">
                            <button
                                type="button"
                                className="btn btn-link"
                                onClick={toggleOptions}
                            >
                                SYSTEM OPTIONS
                            </button>
                            {optionsExpanded && (
                                <div className="options-menu">
                                    <div className="options-buttons">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowRegister(true);
                                                setShowResetPassword(false);
                                                setResetMessage('');
                                                setError(null);
                                            }}
                                        >
                                            NEW COMMANDER
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setShowResetPassword(true);
                                                setShowRegister(false);
                                                setResetMessage('');
                                                setError(null);
                                            }}
                                        >
                                            LOST CREDENTIALS?
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default LoginPage;