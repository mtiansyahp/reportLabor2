// src/routes/Router.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import pages
import AuthPage from '../view/auth/Auth';
import DashboardPage from '../view/page/Dashboard';
import PelaporanBarangPage from '../view/page/PelaporanBarang';
import ManajemenAset from '../view/page/ManajementAsset';
import ManajemenUser from '../view/page/ManagementUser';
import ApprovalPelaporan from '../view/page/ApprovalPelaporan';
import Unauthorized from '../view/page/Unauthorized';

// Inline ProtectedRoute component
interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const isLogin = localStorage.getItem('isLogin') === 'true';
    const role = localStorage.getItem('role');

    if (!isLogin) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role || '')) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

// Routes definition
export default function Router() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'pegawai', 'atasan']}>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/pelaporan-barang"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'pegawai']}>
                        <PelaporanBarangPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/approval-pelaporan"
                element={
                    <ProtectedRoute allowedRoles={['admin', 'pegawai', 'atasan']}>
                        <ApprovalPelaporan />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/manajemen-aset"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ManajemenAset />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/manajemen-user"
                element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <ManajemenUser />
                    </ProtectedRoute>
                }
            />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}
