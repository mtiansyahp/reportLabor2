// src/components/navbar/Navbar.tsx
import React from 'react';
import { Layout, Badge, Avatar, Space, Button, Menu, Dropdown } from 'antd';
import {
    BellOutlined,
    BulbOutlined,
    DownOutlined,
    UserOutlined,
    SettingOutlined,
    LogoutOutlined,
} from '@ant-design/icons';

const { Header } = Layout;
const DEFAULT_AVATAR =
    'https://cdn3d.iconscout.com/3d/premium/thumb/profile-5152816-4315331.png';

const profileMenu = (
    <Menu style={{ width: 220 }}>
        <Menu.Item key="1" icon={<UserOutlined />}>
            Profile
        </Menu.Item>
        <Menu.Item key="2" icon={<SettingOutlined />}>
            Settings
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item key="3" icon={<LogoutOutlined />}>
            Logout
        </Menu.Item>
    </Menu>
);

const Navbar: React.FC = () => {
    const handleToggleTheme = () => {
        console.log('Toggle theme');
    };
    const handleNotifications = () => {
        console.log('Open notifications');
    };

    return (
        <Header style={styles.header}>
            <div style={styles.title}>Dashboard</div>

            <Space size="middle">
                {/* Tips icon
                <Button
                    type="text"
                    shape="circle"
                    icon={<BulbOutlined />}
                    onClick={handleToggleTheme}
                    style={styles.iconButton}
                    aria-label="Tips"
                /> */}

                {/* Notifications icon
                <Badge count={3}>
                    <Button
                        type="text"
                        shape="circle"
                        icon={<BellOutlined />}
                        onClick={handleNotifications}
                        style={styles.iconButton}
                        aria-label="Notifications"
                    />
                </Badge> */}

                {/* Profile avatar + dropdown */}
                <Dropdown overlay={profileMenu} trigger={['click']}>
                    <Button type="text" style={styles.profileButton} aria-label="User menu">
                        <Avatar
                            src={DEFAULT_AVATAR}
                            size={32}
                            alt="Default profile"
                            style={{ objectFit: 'cover' }}
                        />
                        {/* <DownOutlined style={{ marginLeft: 8, fontSize: 18 }} /> */}
                    </Button>
                </Dropdown>
            </Space>
        </Header>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    header: {
        background: '#FFFFFF',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
    },
    title: {
        color: '#1F3053',
        fontSize: 18,
        fontWeight: 500,
    },
    iconButton: {
        color: '#1F3053',
        fontSize: 18,
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    profileButton: {
        color: '#1F3053',
        background: 'transparent',
        border: 'none',
        height: 32,
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        fontSize: 18,
        cursor: 'pointer',
    },
};

export default Navbar;
