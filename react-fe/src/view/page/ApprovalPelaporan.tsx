// src/pages/ApprovalPelaporan.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Layout,
    Card,
    Button,
    Space,
    Modal,
    Tag,
    Typography,
    Input,
    Spin,
    message,
} from 'antd';
import {
    EyeOutlined,
    DeleteOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import DataTable, { TableColumn } from 'react-data-table-component';
import Sidebar from '../component/sidebar/Sidebar';
import Navbar from '../component/navbar/Navbar';
import { api } from '../../api/apiAxios';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

// Sesuaikan dengan shape data di /approval-pelaporan
interface Evidence {
    name: string;
    url: string;
    user_maker: string;
    status_approve: string;
    tanggal_approve?: string | null;
    created_at: string;
    approval_sequence: number;
}

interface Approval {
    id: string;
    manufaktur: string;
    namaBarang: string;
    riwayat: string;
    kelayakan: string;
    catatan?: string;
    created_at: string;
    evidence: Evidence[];
}

interface ApprovalRow {
    id: string;
    namaBarang: string;
    user_maker: string;
    created_at: string;
    status_approve: string;
    tanggal_approve: string | null;
    url_gambar: string;
}

export default function ApprovalPelaporan() {
    const [data, setData] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [selectedReport, setSelectedReport] = useState<ApprovalRow | null>(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [selectedRows, setSelectedRows] = useState<ApprovalRow[]>([]);
    const [role, setRole] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/approval-pelaporan');
                const approvals = res.data.data;

                const mapped: Approval[] = approvals.map((item: any) => ({
                    id: item.id,
                    namaBarang: item.namaBarang,
                    created_at: item.evidence?.[0]?.created_at || '',
                    status_approve: item.evidence?.[0]?.status_approve || '',
                    tanggal_approve: item.evidence?.[0]?.tanggal_approve || '',
                    url_gambar: item.evidence?.[0]?.url || '',
                    evidence: item.evidence || [],
                    manufaktur: item.manufaktur,
                    riwayat: item.riwayat,
                    kelayakan: item.kelayakan,
                    catatan: item.catatan,
                }));

                setData(mapped);
            } catch (err) {
                console.error(err);
                message.error('Gagal mengambil data approval');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const storedRole = localStorage.getItem('role');
        if (storedRole) {
            setRole(storedRole);
        }
    }, []);

    const transformedData: ApprovalRow[] = useMemo(() => {
        return data.map(item => {
            const ev = item.evidence?.[0];
            return {
                id: item.id,
                namaBarang: item.namaBarang,
                user_maker: ev?.user_maker || '-',
                created_at: ev?.created_at || item.created_at,
                status_approve: ev?.status_approve || 'Dalam Proses',
                tanggal_approve: ev?.tanggal_approve || null,
                url_gambar: ev?.url || '',
            };
        });
    }, [data]);

    const handleViewCancel = () => {
        setIsViewModalVisible(false);
        setSelectedReport(null);
    };

    const filteredData = useMemo(() => {
        const lower = filterText.toLowerCase();
        return transformedData.filter(r =>
            r.namaBarang.toLowerCase().includes(lower) ||
            r.user_maker.toLowerCase().includes(lower)
        );
    }, [transformedData, filterText]);

    const columns: TableColumn<ApprovalRow>[] = [
        {
            name: 'Nama Barang',
            selector: row => row.namaBarang,
            sortable: true,
        },
        {
            name: 'User Maker',
            selector: row => row.user_maker,
            sortable: true,
        },
        {
            name: 'Tanggal Waktu Diajukan',
            selector: row => row.created_at,
            sortable: true,
            cell: row => (
                <Text>{new Date(row.created_at).toLocaleString()}</Text>
            ),
        },
        {
            name: 'Status Approval',
            selector: row => row.status_approve || 'Dalam Proses',
            cell: row => (
                <Tag color={row.status_approve ? 'blue' : 'orange'}>
                    {row.status_approve || 'Dalam Proses'}
                </Tag>
            ),
            sortable: true,
        },
        {
            name: 'Tanggal Approve',
            selector: row => row.tanggal_approve || ' - ',
            cell: row => (
                <Text>
                    {row.tanggal_approve
                        ? new Date(row.tanggal_approve).toLocaleString()
                        : ' - '}
                </Text>
            ),
        },
        {
            name: 'Action',
            cell: row => (
                <Space size="middle">
                    <EyeOutlined
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedReport(row);
                            setIsViewModalVisible(true);
                        }}
                    />
                    <DeleteOutlined
                        style={{ cursor: 'pointer', color: 'red' }}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Hapus Pelaporan',
                                content: `Yakin ingin menghapus pelaporan "${row.namaBarang}" oleh ${row.user_maker}?`,
                                onOk: async () => {
                                    try {
                                        await api.delete(`/approval-pelaporan/${row.id}`);
                                        setData(prev => prev.filter(r => r.id !== row.id));
                                        message.success('Pelaporan dihapus');
                                    } catch {
                                        message.error('Gagal menghapus pelaporan');
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

    return (
        <Layout style={styles.root}>
            <Sidebar />
            <Layout style={styles.main}>
                <Navbar />
                <Content style={styles.content}>
                    <Card
                        title="Approval Pelaporan"
                        headStyle={styles.cardHead}
                        style={styles.card}
                        extra={
                            <Space>
                                <Search
                                    placeholder="Cari barang atau user..."
                                    onChange={e => setFilterText(e.target.value)}
                                    style={{ maxWidth: 300 }}
                                    allowClear
                                />
                                {role === 'atasan' && (
                                    <>
                                        <Button
                                            type="primary"
                                            onClick={async () => {
                                                try {
                                                    await Promise.all(selectedRows.map(row =>
                                                        api.put(`/approval-pelaporan/${row.id}`, {
                                                            status_approve: 'approved',
                                                            tanggal_approve: new Date().toISOString(),
                                                        })
                                                    ));
                                                    message.success('Data berhasil di-approve');
                                                    setSelectedRows([]);
                                                    location.reload();
                                                } catch {
                                                    message.error('Gagal approve data');
                                                }
                                            }}
                                            disabled={selectedRows.length === 0}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            danger
                                            onClick={async () => {
                                                try {
                                                    await Promise.all(selectedRows.map(row =>
                                                        api.put(`/approval-pelaporan/${row.id}`, {
                                                            status_approve: 'rejected',
                                                            tanggal_approve: new Date().toISOString(),
                                                        })
                                                    ));
                                                    message.success('Data berhasil ditolak');
                                                    setSelectedRows([]);
                                                    location.reload();
                                                } catch {
                                                    message.error('Gagal reject data');
                                                }
                                            }}
                                            disabled={selectedRows.length === 0}
                                        >
                                            Reject
                                        </Button>
                                    </>
                                )}
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
                                selectableRows
                                onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
                            />
                        </Spin>
                    </Card>

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
                                Detail Pelaporan
                            </Title>
                            <CloseOutlined
                                onClick={handleViewCancel}
                                style={styles.viewClose}
                            />
                        </div>
                        <div style={styles.viewContent}>
                            {selectedReport && (
                                <>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Nama Barang
                                        </Text>
                                        <Text style={styles.viewValue}>
                                            {selectedReport.namaBarang}
                                        </Text>
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Gambar Evidence
                                        </Text>
                                        <img
                                            src={selectedReport.url_gambar}
                                            alt="Evidence"
                                            style={styles.viewImage}
                                        />
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            User Maker
                                        </Text>
                                        <Text style={styles.viewValue}>
                                            {selectedReport.user_maker}
                                        </Text>
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Tanggal Diajukan
                                        </Text>
                                        <Text style={styles.viewValue}>
                                            {new Date(selectedReport.created_at).toLocaleString()}
                                        </Text>
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Status Approval
                                        </Text>
                                        <Tag
                                            color={selectedReport.status_approve ? 'blue' : 'orange'}
                                        >
                                            {selectedReport.status_approve || 'On Proses'}
                                        </Tag>
                                    </div>
                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Tanggal Approve
                                        </Text>
                                        <Text style={styles.viewValue}>
                                            {selectedReport.tanggal_approve
                                                ? new Date(selectedReport.tanggal_approve).toLocaleString()
                                                : 'Sedang Diajukan'}
                                        </Text>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={styles.viewFooter}>
                            <Button onClick={handleViewCancel}>Close</Button>
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
        background: '#FFFFFF',
    },
    viewClose: {
        fontSize: 16,
        cursor: 'pointer',
    },
    viewContent: {
        padding: 24,
        background: '#fff',
    },
    viewSection: {
        marginBottom: 16,
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
        background: '#FFFFFF',
    },
    viewImage: {
        width: '100%',
        maxHeight: 300,
        objectFit: 'cover',
        borderRadius: 4,
    },
};
