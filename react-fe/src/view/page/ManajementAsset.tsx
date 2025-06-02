// src/pages/ManajemenAset.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Layout,
    Card,
    Input,
    Tag,
    Space,
    Button,
    Modal,
    Form,
    Select,
    InputNumber,
    Typography,
    message,
} from 'antd';
import {
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import { DatePicker } from 'antd';
import DataTable, { TableColumn } from 'react-data-table-component';
import Sidebar from '../component/sidebar/Sidebar';
import Navbar from '../component/navbar/Navbar';

import { api } from '../../api/apiAxios';  // ← gunakan axios instance dengan bearer token

const { Content } = Layout;
const { Search } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface Asset {
    id: string;
    nama: string;
    manufaktur: string;
    jumlah: number;
    status: string;
    umur: string;
    riwayat: string;
    created_at: Date;
}


type AssetForm = Omit<Asset, 'id'>;

export default function ManajemenAset() {
    const [data, setData] = useState<Asset[]>([]);
    const fetchedRef = useRef(false);
    const [filterText, setFilterText] = useState('');
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [perPage] = useState(10);
    const [loading, setLoading] = useState(false);

    const [resultModal, setResultModal] = useState({
        visible: false,
        success: true,
        message: '',
    });

    // const [filterText, setFilterText] = useState('');


    const [form] = Form.useForm<Asset>();

    // Ambil data dari API Laravel pada mount
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchAssets(currentPage, filterText);
        }, 300); // Debounce 300ms untuk pencarian

        return () => clearTimeout(timeout);
    }, [currentPage, filterText]);

    const handlePageChange = (page: number) => {
        fetchAssets(page, filterText);
    };

    // useEffect(() => {
    //     const timeout = setTimeout(() => {
    //         fetchAssets(1, filterText);
    //     }, 500); // debounce 500ms

    //     return () => clearTimeout(timeout);
    // }, [filterText]);




    const fetchAssets = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/equipment`, {
                params: {
                    page,
                    per_page: perPage,
                    search,
                },
            });

            const list = res.data.data;
            const assets: Asset[] = list.map((e: { unique_id: any; nama_item: any; manufaktur: any; quantity: any; kondisi_barang: any; umur: any; created_at: any; }) => ({
                id: e.unique_id,
                nama: e.nama_item,
                manufaktur: e.manufaktur,
                jumlah: e.quantity ?? 0,
                status: e.kondisi_barang,
                umur: e.umur,
                riwayat: `${e.umur} tahun`,
                created_at: e.created_at,
            }));

            setData(assets);
            setTotalRows(res.data.meta.total);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
            message.error('Gagal memuat data equipment');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(
        () =>
            data.filter(asset =>
                asset.nama.toLowerCase().includes(filterText.toLowerCase())
            ),
        [data, filterText]
    );

    const columns: TableColumn<Asset>[] = [
        { name: 'Nama Barang', selector: row => row.nama, sortable: true },
        {
            name: 'Manufaktur',
            selector: row => row.manufaktur,
            sortable: true,
            right: true,
        },
        {
            name: 'Jumlah',
            selector: row => row.jumlah,
            sortable: true,
            right: true,
        },
        {
            name: 'Status',
            selector: row => row.status,
            cell: row => (
                <Tag color={row.status === 'Baik' ? 'green' : 'red'}>
                    {row.status}
                </Tag>
            ),
            sortable: true,
        },
        {
            name: 'Umur',
            selector: row => `${row.umur} Bulan`,
            sortable: true
        },
        {
            name: 'Created At',
            selector: (row) => new Date(row.created_at).toLocaleDateString()

        },
        {
            name: 'Action',
            cell: row => (
                <Space size="middle">
                    <EyeOutlined
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedAsset(row);
                            setIsViewModalVisible(true);
                        }}
                    />
                    <EditOutlined
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedAsset(row);
                            form.setFieldsValue({
                                nama: row.nama,
                                manufaktur: row.manufaktur,
                                jumlah: row.jumlah,
                                status: row.status,
                                umur: row.umur,
                                created_at: row.created_at,
                            });


                            setIsEditModalVisible(true);
                        }}
                    />
                    <DeleteOutlined
                        style={{ cursor: 'pointer', color: 'red' }}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Hapus Item',
                                content: `Yakin ingin menghapus "${row.nama}"?`,
                                onOk: async () => {
                                    try {
                                        await api.delete(`/equipment/${row.id}`);
                                        setData(prev => prev.filter(a => a.id !== row.id));
                                        message.success('Item dihapus');
                                    } catch (err) {
                                        message.error('Gagal menghapus item');
                                        console.error(err);
                                    }
                                },
                            });
                        }}
                    />

                </Space>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
    ];

    const openAddModal = () => {
        form.resetFields();
        setIsAddModalVisible(true);
    };

    const handleAdd = async () => {
        try {
            const values = await form.validateFields() as AssetForm;

            const response = await api.post('/equipment', {
                nama_item: values.nama,
                manufaktur: values.manufaktur,
                quantity: values.jumlah,
                kondisi_barang: values.status,
                umur: values.umur,
                created_at: values.created_at, // kirim manual tanggal buat
            });

            const item = response.data.data;

            const newAsset: Asset = {
                id: item.unique_id,
                nama: item.nama_item,
                manufaktur: item.manufaktur,
                jumlah: item.quantity,
                status: item.kondisi_barang,
                umur: item.umur,
                riwayat: `${item.umur} tahun`,
                created_at: item.created_at,
            };

            setData(prev => [newAsset, ...prev]);
            setIsAddModalVisible(false);
            message.success('Item ditambahkan');
            showResultModal(true, 'Item berhasil ditambahkan');
        } catch (err) {
            message.error('Gagal menambahkan item');
            showResultModal(false, 'Gagal menambahkan item');
            console.error(err);

        }
    };





    const handleEdit = async () => {
        try {
            const values = await form.validateFields();

            if (selectedAsset) {
                await api.put(`/equipment/${selectedAsset.id}`, {
                    nama_item: values.nama,
                    manufaktur: values.manufaktur,
                    quantity: values.jumlah,
                    kondisi_barang: values.status,
                    umur: values.umur,
                });

                const updatedAsset: Asset = {
                    id: selectedAsset.id,
                    nama: values.nama,
                    manufaktur: values.manufaktur,
                    jumlah: values.jumlah,
                    status: values.status,
                    umur: values.umur,
                    riwayat: `${values.umur} tahun`,
                    created_at: selectedAsset.created_at, // retain original
                };

                setData(prev =>
                    prev.map(a =>
                        a.id === selectedAsset.id ? updatedAsset : a
                    )
                );

                setIsEditModalVisible(false);
                message.success('Item diperbarui');
                showResultModal(true, 'Item berhasil diperbarui');
            }
        } catch (err) {
            showResultModal(false, 'Gagal memperbarui item');
            message.error('Gagal memperbarui item');
            console.error(err);
        }
    };

    const showResultModal = (success: boolean, messageText: string) => {
        setResultModal({
            visible: true,
            success,
            message: messageText,
        });
    };


    const handleViewCancel = () => setIsViewModalVisible(false);

    return (
        <Layout style={styles.root}>
            <Sidebar />
            <Layout style={styles.main}>
                <Navbar />
                <Content style={styles.content}>
                    <Card
                        title="Manajemen Aset"
                        headStyle={styles.cardHead}
                        style={styles.card}
                        extra={
                            <Space>
                                <Search
                                    placeholder="Cari Nama Barang..."
                                    onChange={e => setFilterText(e.target.value)}
                                    style={{ maxWidth: 300 }}
                                    allowClear
                                    value={filterText}
                                />
                                <Button
                                    type="primary"
                                    onClick={openAddModal}
                                    style={{ background: '#132831', borderColor: '#132831' }}
                                >
                                    Tambah Item
                                </Button>
                            </Space>
                        }
                    >
                        <DataTable
                            columns={columns}
                            data={data}
                            pagination
                            paginationServer
                            paginationTotalRows={totalRows}
                            onChangePage={handlePageChange}
                            paginationPerPage={perPage}
                            progressPending={loading}
                            highlightOnHover
                            pointerOnHover
                            responsive
                            noHeader
                        />

                    </Card>

                    {/* Add Modal */}
                    <Modal
                        title="Tambah Item"
                        visible={isAddModalVisible}
                        onCancel={() => setIsAddModalVisible(false)}
                        onOk={handleAdd}
                        centered
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="nama"
                                label="Nama Barang"
                                rules={[{ required: true, message: 'Masukkan nama barang' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                name="manufaktur"
                                label="Manufaktur"
                                rules={[{ required: true, message: 'Masukkan nama manufaktur' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                name="jumlah"
                                label="Jumlah"
                                rules={[{ required: true, message: 'Masukkan jumlah' }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item
                                name="umur"
                                label="Umur (bulan)"
                                rules={[{ required: true, message: 'Masukkan umur barang' }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item
                                name="status"
                                label="Status"
                                rules={[{ required: true, message: 'Pilih status barang' }]}
                            >
                                <Select placeholder="Pilih status">
                                    <Option value="Baik">Baik</Option>
                                    <Option value="Rusak">Rusak</Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="created"
                                label="Tanggal Dibuat"
                                rules={[{ required: true, message: 'Masukkan tanggal dibuat' }]}
                            >
                                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
                            </Form.Item>

                        </Form>
                    </Modal>


                    {/* Edit Modal */}
                    <Modal
                        title="Edit Item"
                        visible={isEditModalVisible}
                        onCancel={() => setIsEditModalVisible(false)}
                        onOk={handleEdit}
                        centered
                    >
                        <Form form={form} layout="vertical">
                            <Form.Item
                                name="nama"
                                label="Nama Barang"
                                rules={[{ required: true, message: 'Masukkan nama barang' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                name="manufaktur"
                                label="Manufaktur"
                                rules={[{ required: true, message: 'Masukkan nama manufaktur' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                name="jumlah"
                                label="Jumlah"
                                rules={[{ required: true, message: 'Masukkan jumlah' }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item
                                name="umur"
                                label="Umur (bulan)"
                                rules={[{ required: true, message: 'Masukkan umur barang' }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>

                            <Form.Item
                                name="status"
                                label="Status"
                                rules={[{ required: true, message: 'Pilih status barang' }]}
                            >
                                <Select placeholder="Pilih status">
                                    <Option value="Baik">Baik</Option>
                                    <Option value="Rusak">Rusak</Option>
                                </Select>
                            </Form.Item>
                        </Form>
                    </Modal>


                    {/* View Modal */}
                    <Modal
                        visible={isViewModalVisible}
                        footer={null}
                        closable={false}
                        centered
                        bodyStyle={{ padding: 0 }}
                        className="custom-view-modal"
                        onCancel={handleViewCancel}
                    >
                        <div style={styles.viewHeader}>
                            <Title level={4} style={{ margin: 0 }}>
                                Detail Item
                            </Title>
                            <CloseOutlined onClick={handleViewCancel} style={styles.viewClose} />
                        </div>
                        <div style={styles.viewContent}>
                            {selectedAsset && (
                                <>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Nama Barang
                                        </Text>
                                        <Text style={styles.viewValue}>{selectedAsset.nama}</Text>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Manufaktur
                                        </Text>
                                        <Text style={styles.viewValue}>{selectedAsset.manufaktur}</Text>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Jumlah
                                        </Text>
                                        <Text style={styles.viewValue}>{selectedAsset.jumlah}</Text>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Umur
                                        </Text>
                                        <Text style={styles.viewValue}>{selectedAsset.umur} Bulan</Text>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Status
                                        </Text>
                                        <Tag color={selectedAsset.status === 'Baik' ? 'green' : 'red'}>
                                            {selectedAsset.status}
                                        </Tag>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Tanggal Dibuat
                                        </Text>
                                        <Text style={styles.viewValue}>
                                            {new Date(selectedAsset.created_at).toLocaleDateString()}
                                        </Text>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={styles.viewFooter}>
                            <Button onClick={handleViewCancel}>Close</Button>
                        </div>
                    </Modal>

                    <Modal
                        visible={resultModal.visible}
                        onCancel={() => setResultModal(prev => ({ ...prev, visible: false }))}
                        footer={[
                            <Button key="ok" type="primary" onClick={() => setResultModal(prev => ({ ...prev, visible: false }))}>
                                OK
                            </Button>,
                        ]}
                        centered
                    >
                        <div style={{ textAlign: 'center' }}>
                            <Typography.Title level={4} style={{ color: resultModal.success ? 'green' : 'red' }}>
                                {resultModal.success ? 'Berhasil' : 'Gagal'}
                            </Typography.Title>
                            <Typography.Text>{resultModal.message}</Typography.Text>
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
    viewClose: {
        fontSize: 16,
        cursor: 'pointer',
    },
    viewContent: {
        backgroundColor: '#fff',
        padding: '24px',
    },
    viewSection: {
        marginBottom: 24,
    },
    viewLabel: {
        display: 'block',
        marginBottom: 4,
    },
    viewValue: {
        fontSize: 16,
    },
    viewFooter: {
        padding: '10px 24px',
        textAlign: 'right',
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
};
