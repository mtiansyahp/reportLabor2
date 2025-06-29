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

interface User { // untuk mendefinisikan tipe data User
    id: number; // ID unik untuk user
    name: string; // Nama lengkap user
    email: string; // Alamat email user
    role: string; // Peran user (admin, pegawai, atasan)
    is_active: boolean; // Status aktif/inaktif user
}
export default function ManajemenUser() {
    const [data, setData] = useState<User[]>([]); // State untuk menyimpan data user
    const [filterText, setFilterText] = useState(''); // State untuk menyimpan teks filter
    const [loading, setLoading] = useState(false); // State untuk mengatur status loading
    const [isAddModalVisible, setIsAddModalVisible] = useState(false); // State untuk mengatur visibilitas modal tambah user
    const [isEditModalVisible, setIsEditModalVisible] = useState(false); // State untuk mengatur visibilitas modal edit user
    const [isViewModalVisible, setIsViewModalVisible] = useState(false); // State untuk mengatur visibilitas modal lihat detail user
    const [selectedUser, setSelectedUser] = useState<User | null>(null); // State untuk menyimpan user yang dipilih
    const [form] = Form.useForm(); // Form instance untuk menangani form input
    const fetchedRef = useRef(false); // Ref untuk memastikan data hanya di-fetch sekali

    const fetchUsers = async () => { // Fungsi untuk mengambil data user dari API
        setLoading(true);
        try {
            const res = await api.get('/users'); // Mengambil data user dari endpoint API
            const users: User[] = res.data.data.map((u: any) => ({ // Mengonversi data yang diterima menjadi tipe User
                id: u.id, // ID unik user
                name: u.name, // Nama lengkap user
                email: u.email, // Alamat email user
                role: u.role, // Peran user (admin, pegawai, atasan)
                is_active: u.is_active, // Status aktif/inaktif user
            }));
            setData(users);
        } catch (err) {
            console.error(err);
            message.error('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { // Hook untuk mengambil data user saat komponen pertama kali dimuat
        if (!fetchedRef.current) {
            fetchedRef.current = true;
            fetchUsers();
        }
    }, []);
    const openAddModal = () => { // Fungsi untuk membuka modal tambah user
        form.resetFields();
        setIsAddModalVisible(true);
    };

    const handleAdd = async () => { // Fungsi untuk menangani penambahan user baru
        try {
            const values = await form.validateFields();
            await api.post('/users', { // Mengirim data user baru ke endpoint API
                name: values.name, // Nama lengkap user
                email: values.email, // Alamat email user
                role: values.role, // Peran user (admin, pegawai, atasan)
                is_active: values.is_active ? 1 : 0, // Status aktif/inaktif user
            });
            message.success('User ditambahkan'); // Menampilkan pesan sukses
            setIsAddModalVisible(false); // Menutup
            fetchUsers(); // Memuat ulang data user
        } catch (err) {
            console.error(err);
            message.error('Gagal menambah user'); // Menampilkan pesan error jika terjadi kesalahan
        }
    };

    const handleEdit = async () => { // Fungsi untuk menangani pembaruan data user
        if (!selectedUser) return;
        try {
            const values = await form.validateFields(); // Memvalidasi form input
            await api.put(`/users/${selectedUser.id}`, { // Mengirim data user yang diperbarui ke endpoint API
                name: values.name, // Nama lengkap user
                email: values.email, // Alamat email user
                role: values.role, // Peran user (admin, pegawai, atasan)
                is_active: values.is_active ? 1 : 0, // Status aktif/inaktif user
            });
            message.success('User diperbarui');
            setIsEditModalVisible(false);
            fetchUsers();
        } catch (err) {
            console.error(err);
            message.error('Gagal memperbarui user');
        }
    };
    const filteredData = useMemo( // Menggunakan useMemo untuk mengoptimalkan filter data
        () =>
            data.filter(u =>
                u.name.toLowerCase().includes(filterText.toLowerCase()) || // Memfilter berdasarkan nama
                u.email.toLowerCase().includes(filterText.toLowerCase()) // atau email
            ),
        [data, filterText] // Dependensi untuk useMemo
    );

    const columns: TableColumn<User>[] = [ // Mendefinisikan kolom untuk DataTable
        { name: 'Nama', selector: r => r.name, sortable: true }, // Kolom untuk nama user
        { name: 'Email', selector: r => r.email, sortable: true }, // Kolom untuk email user
        {
            name: 'Roles', // Kolom untuk peran user
            selector: r => r.role, // Mengambil nilai peran dari user
            sortable: true, // Mengizinkan pengurutan berdasarkan peran
            cell: r => <Text>{r.role}</Text>, // Menampilkan peran sebagai teks
        },
        {
            name: 'Active', // Kolom untuk status aktif/inaktif user
            selector: r => r.is_active, //  Mengambil nilai status aktif dari user
            sortable: true, // Mengizinkan pengurutan berdasarkan status aktif
            cell: r => ( // Menampilkan status aktif sebagai Tag
                <Tag color={r.is_active ? 'green' : 'red'}> 
                    {r.is_active ? 'Active' : 'Inactive'}
                </Tag> // untuk menandai status aktif atau inaktif
            ),
        },
        {
            name: 'Action', // Kolom untuk tindakan yang dapat dilakukan pada user
            cell: r => ( // Menampilkan ikon untuk melihat, mengedit, dan menghapus user
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
                    <DeleteOutlined style={{ color: 'red' }} onClick={() => { // Menangani penghapusan user
                        Modal.confirm({ // Menampilkan konfirmasi sebelum menghapus user
                            title: 'Hapus User',
                            content: `Yakin ingin menghapus "${r.name}"?`,
                            onOk: async () => { // Jika pengguna mengonfirmasi penghapusan
                                try {
                                    await api.delete(`/users/${r.id}`); // Mengirim permintaan penghapusan user ke endpoint API
                                    message.success('User dihapus'); // Menampilkan pesan sukses
                                    fetchUsers(); // Memuat ulang data user
                                } catch (e) { // Menangani kesalahan saat menghapus user
                                    console.error(e); // Menampilkan pesan error di konsol
                                    message.error('Gagal menghapus user'); // Menampilkan pesan error
                                }
                            }
                        });
                    }} />
                </Space>// Menampilkan ikon untuk melihat, mengedit, dan menghapus user
            ),
            ignoreRowClick: true, // Mengabaikan klik pada baris untuk kolom ini
            allowOverflow: true, // Mengizinkan overflow pada kolom ini
            button: true, // Mengizinkan tombol pada kolom ini
        },
    ];
    return ( // Komponen utama Manajemen User
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
                    <Modal // Modal untuk mengedit user
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
                    <Modal // Modal untuk melihat detail user
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
const styles: { [key: string]: React.CSSProperties } = { // Styles untuk komponen Manajemen User
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
