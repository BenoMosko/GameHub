import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/ResetPasswordPage/ResetPasswordPage.css';

const ENDPOINT = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8200';

function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Get token from URL parameters
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('PASSWORDS DO NOT MATCH');
            return;
        }

        if (password.length < 6) {
            setError('PASSWORD MUST BE AT LEAST 6 CHARACTERS');
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${ENDPOINT}/api/users/reset-password/${token}`, {
                password
            });

            setMessage('CREDENTIALS UPDATED SUCCESSFULLY. REDIRECTING...');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.message || 'FAILED TO RESET CREDENTIALS');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="reset-password-page">
            <div className="reset-container">
                <h2 className="form-header">Security Update</h2>
                <p className="form-description">
                    ENTER NEW SECURITY CODE TO RESTORE ACCESS.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            className="form-input"
                            type="password"
                            placeholder="NEW SECURITY CODE"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <input
                            className="form-input"
                            type="password"
                            placeholder="CONFIRM SECURITY CODE"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'UPDATING...' : 'UPDATE CREDENTIALS'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="alert alert-error">
                        ⚠️ {error}
                    </div>
                )}

                {message && (
                    <div className="alert alert-success">
                        ✅ {message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;
