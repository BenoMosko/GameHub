import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
    const token = sessionStorage.getItem('token');

    // If token exists, render child routes (Outlet)
    // If not, redirect to login page
    return token ? <Outlet /> : <Navigate to="/" />;
};

export default PrivateRoute;
