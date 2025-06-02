// src/routes/Router.tsx atau tempat kamu mendefinisikan ProtectedRoute
import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const isLogin = localStorage.getItem('isLogin') === 'true';
    const userRole = localStorage.getItem('role');

    if (!isLogin) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole || '')) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
