import React from 'react';
import {
    Form,
    Input,
    Button,
    Modal,
    Layout,
    Row,
    Col,
    Typography,
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/apiAxios';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

interface LoginValues {
    email: string;
    password: string;
}

const AuthPage: React.FC = () => {
    const navigate = useNavigate();

    const onFinish = async (values: LoginValues) => {
        try {
            const res = await authApi.post('/login', {
                email: values.email,
                password: values.password,
            });

            localStorage.setItem('isLogin', 'true');
            localStorage.setItem('token', res.data.data.token);
            localStorage.setItem('role', res.data.data.user.role);
            localStorage.setItem('name', res.data.data.user.name);

            Modal.success({
                title: 'Login Berhasil',
                content: (
                    <div>
                        <p>Status: {res.status}</p>
                        <p>Pesan: {res.data.message}</p>
                    </div>
                ),
                onOk: () => {
                    navigate('/dashboard', { replace: true });
                },
            });
        } catch (err: any) {
            Modal.error({
                title: 'Login Gagal',
                content: err.response?.data?.message || 'Email atau password salah',
            });
        }
    };

    return (
        <Layout style={{ height: '100vh' }}>
            <Sider
                width="65%"
                style={{
                    background: 'linear-gradient(150deg, #6e3ad6 0%, #132831 100%)',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 32,
                }}
            >
                <img
                    src="https://cdn3d.iconscout.com/3d/premium/thumb/project-management-6102638-5058803.png"
                    alt="Ilustrasi Login"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />

            </Sider>

            <Content style={{ width: '35%', background: '#fff' }}>
                <Row
                    justify="center"
                    align="middle"
                    style={{ height: '100%', padding: '60px 40px' }}
                >
                    <Col span={20}>
                        <Title level={2} style={{ marginBottom: 8 }}>
                            Selamat Datang di Lapor Lab
                        </Title>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                            Login to your account
                        </Text>

                        <Form<LoginValues>
                            name="login"
                            layout="vertical"
                            onFinish={onFinish}
                            onFinishFailed={(errorInfo) =>
                                console.log('Validation Failed:', errorInfo)
                            }
                        >
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[
                                    { required: true, message: 'Please input your email!' },
                                    { type: 'email', message: 'Format email tidak valid!' },
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="admin@demo.com"
                                    size="large"
                                    style={{ borderRadius: 6, backgroundColor: '#fff' }}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[{ required: true, message: 'Please input your password!' }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="••••••••"
                                    size="large"
                                    style={{ borderRadius: 6, backgroundColor: '#fff' }}
                                />
                            </Form.Item>

                            <Form.Item>
                                <a style={{ fontSize: 12, color: '#8165f5', float: 'right' }}>
                                    Forgot Password?
                                </a>
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    style={{
                                        borderRadius: 6,
                                        background: 'linear-gradient(90deg, #6e3ad6, #b198f5)',
                                        border: 'none',
                                        fontSize: 16,
                                    }}
                                >
                                    Sign In
                                </Button>
                            </Form.Item>

                            <div style={{ textAlign: 'center', fontSize: 12, color: '#999' }}>
                                Don’t have an account? <a>Register</a>
                            </div>
                        </Form>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default AuthPage;
