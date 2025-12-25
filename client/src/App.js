// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './components/LoginPage/LoginPage';
import DashboardPage from './components/DasboardPage/DashboardPage';
import AdminDashboardPage from './components/AdminDashboardPage/AdminDashboardPage';

import NewsPage from './components/NewsPage/NewsPage';
import ChatPage from './components/Chat/ChatPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import GamesPage from './components/GamesPage/GamesPage';
import PrivateRoute from './components/routing/PrivateRoute';
import Navbar from './components/Layout/Navbar';

import MiniChat from './components/Chat/MiniChat';
import ResetPasswordPage from './components/ResetPasswordPage/ResetPasswordPage';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LoginPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                {/* Standalone MiniChat Route (No Layout) */}
                <Route path="/minichat" element={<MiniChat />} />

                {/* Protected Routes */}
                <Route element={<><Navbar /><PrivateRoute /></>}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/games" element={<GamesPage />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;