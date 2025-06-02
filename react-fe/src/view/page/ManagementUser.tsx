import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Layout, Card, Input, Tag, Space, Button, Modal, Form,
    Select, Typography, Radio, message, Spin
} from 'antd';
import {
    EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined, CloseOutlined,
} from '@ant-design/icons';
import DataTable, { TableColumn } from 'react-data-table-component';
import Sidebar from '../component/sidebar/Sidebar';
import Navbar from '../component/navbar/Navbar';
import { api } from '../../api/apiAxios';

const { Content } = Layout;
const { Search } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
}
export default function ManajemenUser() {
    const [data, setData] = useState<User[]>([]);
    const [filterText, setFilterText] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [form] = Form.useForm();
    const fetchedRef = useRef(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            const users: User[] = res.data.data.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                is_active: u.is_active,
            }));
            setData(users);
        } catch (err) {
            console.error(err);
            message.error('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!fetchedRef.current) {
            fetchedRef.current = true;
            fetchUsers();
        }
    }, []);
    const openAddModal = () => {
        form.resetFields();
        setIsAddModalVisible(true);
    };

    const handleAdd = async () => {
        try {
            const values = await form.validateFields();
            await api.post('/users', {
                name: values.name,
                email: values.email,
                role: values.role,
                is_active: values.is_active ? 1 : 0,
            });
            message.success('User ditambahkan');
            setIsAddModalVisible(false);
            fetchUsers();
        } catch (err) {
            console.error(err);
            message.error('Gagal menambah user');
        }
    };

    const handleEdit = async () => {
        if (!selectedUser) return;
        try {
            const values = await form.validateFields();
            await api.put(`/users/${selectedUser.id}`, {
                name: values.name,
                email: values.email,
                role: values.role,
                is_active: values.is_active ? 1 : 0,
            });
            message.success('User diperbarui');
            setIsEditModalVisible(false);
            fetchUsers();
        } catch (err) {
            console.error(err);
            message.error('Gagal memperbarui user');
        }
    };
    const filteredData = useMemo(
        () =>
            data.filter(u =>
                u.name.toLowerCase().includes(filterText.toLowerCase()) ||
                u.email.toLowerCase().includes(filterText.toLowerCase())
            ),
        [data, filterText]
    );

    const columns: TableColumn<User>[] = [
        { name: 'Nama', selector: r => r.name, sortable: true },
        { name: 'Email', selector: r => r.email, sortable: true },
        {
            name: 'Roles',
            selector: r => r.role,
            sortable: true,
            cell: r => <Text>{r.role}</Text>,
        },
        {
            name: 'Active',
            selector: r => r.is_active,
            sortable: true,
            cell: r => (
                <Tag color={r.is_active ? 'green' : 'red'}>
                    {r.is_active ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            name: 'Action',
            cell: r => (
                <Space size="middle">
                    <EyeOutlined onClick={() => { setSelectedUser(r); setIsViewModalVisible(true); }} />
                    <EditOutlined onClick={() => {
                        setSelectedUser(r);
                        form.setFieldsValue({
                            name: r.name,
                            email: r.email,
                            role: r.role,
                            is_active: r.is_active,
                        });
                        setIsEditModalVisible(true);
                    }} />
                    <DeleteOutlined style={{ color: 'red' }} onClick={() => {
                        Modal.confirm({
                            title: 'Hapus User',
                            content: `Yakin ingin menghapus "${r.name}"?`,
                            onOk: async () => {
                                try {
                                    await api.delete(`/users/${r.id}`);
                                    message.success('User dihapus');
                                    fetchUsers();
                                } catch (e) {
                                    console.error(e);
                                    message.error('Gagal menghapus user');
                                }
                            }
                        });
                    }} />
                </Space>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
    ];
    return (
        <Layout style={styles.root}>
            <Sidebar />
            <Layout style={styles.main}>
                <Navbar />
                <Content style={styles.content}>
                    <Card
                        title="Manajemen User"
                        headStyle={styles.cardHead}
                        style={styles.card}
                        extra={
                            <Space>
                                <Search
                                    placeholder="Cari nama atau email..."
                                    onChange={e => setFilterText(e.target.value)}
                                    style={{ maxWidth: 300 }}
                                    allowClear
                                />
                                <Button
                                    type="primary"
                                    onClick={openAddModal}
                                    style={{ background: '#132831', borderColor: '#132831' }}
                                >
                                    Tambah User
                                </Button>
                            </Space>
                        }
                    >
                        <Spin spinning={loading}>
                            <DataTable
                                columns={columns}
                                data={filteredData}
                                pagination
                                highlightOnHover
                                pointerOnHover
                                responsive
                                noHeader
                            />
                        </Spin>
                    </Card>

                    {/* Add Modal */}
                    <Modal
                        title="Tambah User"
                        open={isAddModalVisible}
                        onCancel={() => setIsAddModalVisible(false)}
                        onOk={handleAdd}
                        centered
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="email" label="Email" rules={[
                                { required: true },
                                { type: 'email', message: 'Format email tidak valid' },
                            ]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="role" label="Roles" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="admin">Admin</Option>
                                    <Option value="pegawai">Pegawai</Option>
                                    <Option value="atasan">Atasan</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
                                <Radio.Group>
                                    <Radio value={true}>Active</Radio>
                                    <Radio value={false}>Inactive</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* Edit Modal */}
                    <Modal
                        title="Edit User"
                        open={isEditModalVisible}
                        onCancel={() => setIsEditModalVisible(false)}
                        onOk={handleEdit}
                        centered
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item name="name" label="Nama" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="email" label="Email" rules={[
                                { required: true },
                                { type: 'email', message: 'Format email tidak valid' },
                            ]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="role" label="Roles" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="admin">Admin</Option>
                                    <Option value="pegawai">Pegawai</Option>
                                    <Option value="atasan">Atasan</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="is_active" label="Status" rules={[{ required: true }]}>
                                <Radio.Group>
                                    <Radio value={true}>Active</Radio>
                                    <Radio value={false}>Inactive</Radio>
                                </Radio.Group>
                            </Form.Item>
                        </Form>
                    </Modal>

                    {/* View Modal */}
                    <Modal
                        open={isViewModalVisible}
                        footer={null}
                        closable={false}
                        centered
                        onCancel={() => setIsViewModalVisible(false)}
                        bodyStyle={{ padding: 0 }}
                    >
                        <div style={styles.viewHeader}>
                            <Title level={4} style={{ margin: 0 }}>Detail User</Title>
                            <CloseOutlined onClick={() => setIsViewModalVisible(false)} style={styles.viewClose} />
                        </div>
                        <div style={styles.viewContent}>
                            {selectedUser && (
                                <>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary">Nama</Text>
                                        <Text>{selectedUser.name}</Text>
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary">Email</Text>
                                        <Text>{selectedUser.email}</Text>
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary">Role</Text>
                                        <Text>{selectedUser.role}</Text>
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary">Status</Text>
                                        <Tag color={selectedUser.is_active ? 'green' : 'red'}>
                                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                                        </Tag>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={styles.viewFooter}>
                            <Button onClick={() => setIsViewModalVisible(false)}>Close</Button>
                        </div>
                    </Modal>
                </Content>
            </Layout>
        </Layout>
    );
}
const styles: { [key: string]: React.CSSProperties } = {
    root: { minHeight: '100vh', overflowX: 'hidden' },
    main: { marginLeft: 200 },
    content: { background: '#ECF2FF', padding: 24, overflowY: 'auto' },
    cardHead: {
        color: '#132831',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        fontWeight: 500,
    },
    card: {
        background: '#FFFFFF',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    viewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    viewClose: { fontSize: 16, cursor: 'pointer' },
    viewContent: { backgroundColor: '#fff', padding: '24px' },
    viewSection: { marginBottom: 24 },
    viewLabel: { display: 'block', marginBottom: 4 },
    viewValue: { fontSize: 16 },
    viewFooter: {
        padding: '10px 24px',
        textAlign: 'right',
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
};
