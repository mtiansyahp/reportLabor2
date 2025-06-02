// src/components/Sidebar.tsx
import React from 'react';
import { Layout, Menu, message } from 'antd';
import {
    DashboardOutlined,
    FileTextOutlined,
    DatabaseOutlined,
    TeamOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApprovalSharp } from '@mui/icons-material';

const { Sider } = Layout;

const LOGO_URL =
    'https://static.vecteezy.com/system/resources/previews/022/100/233/original/mercedes-benz-white-logo-transparent-free-png.png';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.clear();
        message.success('Anda berhasil logout');
        navigate('/login', { replace: true });
    };

    const onMenuClick = ({ key }: { key: string }) => {
        if (key === '/logout') {
            handleLogout();
        } else {
            navigate(key);
        }
    };

    const menuItems = [
        {
            key: '/dashboard',
            label: 'Dashboard',
            icon: <DashboardOutlined />,
            roles: ['admin', 'pegawai', 'atasan'],
        },
        {
            key: '/pelaporan-barang',
            label: 'Pelaporan Barang',
            icon: <FileTextOutlined />,
            roles: ['admin', 'pegawai'],
        },
        {
            key: '/approval-pelaporan',
            label: 'Approval Pelaporan',
            icon: <ApprovalSharp />,
            roles: ['admin', 'pegawai', 'atasan'],
        },
        {
            key: '/manajemen-aset',
            label: 'Manajemen Aset',
            icon: <DatabaseOutlined />,
            roles: ['admin'],
        },
        {
            key: '/manajemen-user',
            label: 'Manajemen User',
            icon: <TeamOutlined />,
            roles: ['admin'],
        },
        {
            key: '/logout',
            label: 'Keluar',
            icon: <LogoutOutlined />,
            roles: ['admin', 'pegawai', 'atasan'],
        },
    ];

    const filteredMenu = menuItems.filter((item) => item.roles.includes(role || ''));

    return (
        <Sider
            width={200}
            theme="dark"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                height: '100vh',
                overflowY: 'auto',
                background: '#132831',
            }}
        >
            {/* Logo */}
            <div style={styles.logoContainer}>
                <img src={LOGO_URL} alt="ReportLab Logo" style={styles.logoImg} />
                <span style={styles.logoText}>REPORTLAB</span>
            </div>

            {/* Dynamic Menu */}
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                onClick={onMenuClick}
                style={{ background: 'transparent', border: 'none' }}
                items={filteredMenu}
            />
        </Sider>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 0',
    },
    logoImg: {
        width: 32,
        height: 32,
        objectFit: 'contain',
        marginRight: 8,
    },
    logoText: {
        fontFamily: 'Montserrat, sans-serif',
        fontSize: 18,
        fontWeight: 700,
        color: '#ECF2FF',
        textTransform: 'uppercase',
        letterSpacing: '2px',
    },
};

export default Sidebar;
