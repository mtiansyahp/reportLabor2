// src/pages/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';
import { Modal, Table } from 'antd';
import {
    Layout,
    Row,
    Col,
    Card,
    List,
    Typography,
    Spin,
    message,
} from 'antd';
import Sidebar from '../component/sidebar/Sidebar';
import Navbar from '../component/navbar/Navbar';

const { Content } = Layout;
const { Title, Text } = Typography;

interface Approval {
    id: number;
    namaBarang: string;
    user_maker: string;
    created_at: string;
    status_approve: string | null;
}

interface Asset {
    kondisi_barang: any;
    id: string;
    nama: string;
    kategori: string;
    status: 'Layak' | string;
    jumlah: number;
}

interface Summary {
    total_asset: number;
    total_asset_layak: number;
    total_asset_tidak_layak: number;
    ratio_asset_layak: number;
    ratio_asset_tidak_layak: number;
    total_pelaporan: number;
}

const Dashboard: React.FC = () => {
    const [approvalData, setApprovalData] = useState<Approval[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalData, setModalData] = useState<any[]>([]);


    // summary state
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // fetch approvals & assets
    useEffect(() => {
        setLoadingChart(true);

        fetch('http://127.0.0.1:8000/api/approval-pelaporan')
            .then(r => r.json())
            .then((response) => {
                setApprovalData(response.data); // <- ambil array dari properti "data"
            })

            .catch(err => {
                console.error(err);
                message.error('Gagal mengambil data');
            })
            .finally(() => {
                setLoadingChart(false);
            });

    }, []);


    // fetch summary from our Laravel API
    useEffect(() => {
        setLoadingSummary(true);
        fetch('http://localhost:8000/api/equipment-summary')
            .then(r => {
                if (!r.ok) throw new Error('Network response was not ok');
                return r.json();
            })
            .then((data: Summary) => {
                setSummary(data);
            })
            .catch(err => {
                console.error(err);
                message.error('Gagal mengambil ringkasan aset');
            })
            .finally(() => {
                setLoadingSummary(false);
            });
    }, []);

    // 7-day area chart data
    const { categories, series } = useMemo(() => {
        const now = new Date();
        const days: Date[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            days.push(d);
        }
        const categories = days.map(d =>
            d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
        );
        const approveData: number[] = [];
        const rejectData: number[] = [];
        const pendingData: number[] = [];
        days.forEach(day => {
            const start = new Date(day);
            start.setHours(0, 0, 0, 0);
            const end = new Date(day);
            end.setHours(23, 59, 59, 999);
            let a = 0, r = 0, p = 0;
            approvalData.forEach(item => {
                const c = new Date(item.created_at);
                if (c >= start && c <= end) {
                    if (item.status_approve === 'Approve') a++;
                    else if (item.status_approve === 'Reject') r++;
                    else p++;
                }
            });
            approveData.push(a);
            rejectData.push(r);
            pendingData.push(p);
        });
        return {
            categories,
            series: [
                { name: 'Approve', data: approveData },
                { name: 'Reject', data: rejectData },
                { name: 'Belum Approve', data: pendingData },
            ],
        };
    }, [approvalData]);

    const areaOptions: ApexOptions = {
        chart: { type: 'area', stacked: true, toolbar: { show: false } },
        xaxis: { categories },
        dataLabels: { enabled: false },
        legend: { position: 'top' },
        fill: { opacity: 0.8 },
        colors: ['#52c41a', '#f5222d', '#d9d9d9'],
    };

    // radial bar for % Layak
    const totalJumlah = useMemo(() => assets.reduce((sum, a) => sum + a.jumlah, 0), [assets]);
    // pakai toLowerCase agar 'layak'/'Layak' ter‐match
    const layakJumlah = useMemo(
        () =>
            assets
                .filter(a => a.kondisi_barang.toLowerCase() === 'baik')
                .reduce((sum, a) => sum + a.jumlah, 0),
        [assets]
    );

    const handleCardClick = (filter?: string) => {
        setModalLoading(true);
        setIsModalVisible(true);

        let url = 'http://localhost:8000/api/equipment-detail-summary';

        if (filter === 'approval') {
            url = 'http://localhost:8000/api/approval-pelaporan';
        } else if (filter) {
            url += `?kondisi=${encodeURIComponent(filter)}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setModalData(data.data);
            })
            .catch(err => {
                console.error(err);
                message.error('Gagal mengambil data detail');
            })
            .finally(() => {
                setModalLoading(false);
            });
    };





    const layakPercent = totalJumlah > 0 ? Math.round((layakJumlah / totalJumlah) * 100) : 0;

    // sesudah:
    const radialSeries = [summary?.ratio_asset_layak ? summary.ratio_asset_layak * 100 : 0];

    const radialOptions: ApexOptions = {
        chart: { type: 'radialBar' },
        plotOptions: {
            radialBar: {
                hollow: { size: '60%' },
                dataLabels: {
                    name: { show: true, fontSize: '14px' },
                    value: {
                        show: true,
                        fontSize: '20px',
                        formatter: val => `${val.toFixed(2)}%`,  // ← iki
                    },
                },
            },
        },
        labels: ['% Layak'],
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.3,
                gradientToColors: ['#00E396'],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100],
            },
        },
        colors: ['#008FFB'],
    };

    // recent 4 pelaporan
    const recentActivities = useMemo(() => {
        return approvalData
            .slice()
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .slice(0, 4)
            .map(item => ({
                title: `Pelaporan ${item.namaBarang} oleh ${item.user_maker}`,
                date: new Date(item.created_at).toLocaleString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }),
            }));
    }, [approvalData]);

    // saya menggunakan antd design dan apex chart dimana sudah bawaan dari library nya jadi saya tinggal masukin data dari api /summary /equiment

    // stats cards, driven by summary
    const stats = [
        {
            label: 'Total Pelaporan',
            value: summary?.total_pelaporan ?? 0,
            icon: <img src="/assets/analysis-graph.png" alt="" width={60} height={60} />,
        },
        {
            label: 'Total Asset Tercatat',
            value: summary?.total_asset ?? 0,
            icon: <img src="/assets/job-search.png" alt="" width={60} height={60} />,
        },
        {
            label: 'Total Asset Layak',
            value: summary?.total_asset_layak ?? 0,
            icon: <img src="/assets/planning.png" alt="" width={60} height={60} />,
        },
        {
            label: 'Total Asset Tidak Layak',
            value: summary?.total_asset_tidak_layak ?? 0,
            icon: <img src="/assets/teamwork.png" alt="" width={60} height={60} />,
        },
    ];

    return (
        <>
            <Layout style={styles.root}>
                <Sidebar />
                <Layout style={styles.main}>
                    <Navbar />
                    <Content style={styles.content}>
                        <div style={styles.inner}>

                            {/* Stats Cards */}
                            <Spin spinning={loadingSummary}>
                                <Row gutter={[24, 24]}>
                                    {stats.map((s, i) => (
                                        <Col xs={24} sm={12} md={6} key={i}>
                                            <Card
                                                style={styles.statCard}
                                                bodyStyle={{ padding: 20, position: 'relative', cursor: 'pointer' }}
                                                onClick={
                                                    i === 0 ? () => handleCardClick('approval') :                 // Total Pelaporan
                                                        i === 1 ? () => handleCardClick() :                           // Total Asset
                                                            i === 2 ? () => handleCardClick('!=Rusak') :                  // Layak
                                                                i === 3 ? () => handleCardClick('Rusak') :                    // Tidak Layak
                                                                    undefined
                                                }
                                            >
                                                <div style={styles.cardIconWrapper}>
                                                    {React.cloneElement(s.icon, { style: styles.cardIcon })}
                                                </div>
                                                <Title level={3} style={styles.statValue}>{s.value}</Title>
                                                <Text style={styles.statLabel}>{s.label}</Text>
                                            </Card>
                                        </Col>
                                    ))}

                                </Row>
                            </Spin>

                            {/* Approval Chart */}
                            <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                                <Col xs={24} lg={16}>
                                    <Card title="Approval Chart (7 Hari Terakhir)"
                                        style={styles.chartCard} headStyle={styles.cardHead}
                                        bodyStyle={{ minHeight: 260 }}>
                                        <Spin spinning={loadingChart}>
                                            <Chart options={areaOptions} series={series} type="area" height={260} />
                                        </Spin>
                                    </Card>
                                </Col>
                                <Col xs={24} lg={8}>
                                    <Card title="Persentase Asset Layak"
                                        style={styles.chartCard} headStyle={styles.cardHead}
                                        bodyStyle={{ textAlign: 'center', minHeight: 260, paddingTop: 40 }}>
                                        {loadingAssets ? (
                                            <Spin />
                                        ) : (
                                            <>
                                                <Chart
                                                    options={radialOptions}
                                                    series={[summary ? summary.ratio_asset_layak * 100 : 0]}
                                                    type="radialBar"
                                                    height={200}
                                                />
                                                <Text style={{ marginTop: 16 }}>
                                                    {summary
                                                        ? `${summary.total_asset_layak} dari ${summary.total_asset} unit`
                                                        : '-'}
                                                </Text>
                                            </>
                                        )}
                                    </Card>
                                </Col>
                            </Row>

                            {/* Recent Pelaporan */}
                            <Row gutter={[24, 24]} style={{ marginTop: 24, marginBottom: 24 }}>
                                <Col xs={24} md={12}>
                                    <Card title={
                                        <div style={styles.activitiesHeader}>
                                            <span>Recent Pelaporan</span>
                                            <Link to="/approval-pelaporan">View All</Link>
                                        </div>}
                                        style={styles.chartCard} headStyle={styles.cardHead}
                                        bodyStyle={{ padding: 10 }}>
                                        <List itemLayout="horizontal" dataSource={recentActivities} split={false}
                                            renderItem={item => (
                                                <List.Item style={styles.listItem}>
                                                    <List.Item.Meta
                                                        title={<Text style={styles.listTitle}>{item.title}</Text>}
                                                        description={<Text type="secondary">{item.date}</Text>}
                                                    />
                                                </List.Item>
                                            )} />
                                    </Card>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Card title="Monthly Active Users"
                                        style={styles.chartCard} headStyle={styles.cardHead}
                                        bodyStyle={{ minHeight: 240 }} />
                                </Col>
                            </Row>

                        </div>
                    </Content>
                </Layout>
            </Layout>
            <Modal
                title="Detail Data"
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={900}
            >
                <Spin spinning={modalLoading}>
                    <Table
                        rowKey={(record) => record.id || record.equipment_id}
                        dataSource={modalData}
                        pagination={{ pageSize: 5 }}
                        columns={
                            modalData.length > 0 && modalData[0]?.namaBarang
                                ? [
                                    {
                                        title: 'Nama Barang',
                                        dataIndex: 'namaBarang',
                                        key: 'namaBarang',
                                    },
                                    {
                                        title: 'Manufaktur',
                                        dataIndex: 'manufaktur',
                                        key: 'manufaktur',
                                    },
                                    {
                                        title: 'Riwayat',
                                        dataIndex: 'riwayat',
                                        key: 'riwayat',
                                    },
                                    {
                                        title: 'Kelayakan',
                                        dataIndex: 'kelayakan',
                                        key: 'kelayakan',
                                    },
                                    {
                                        title: 'Status Approve',
                                        dataIndex: ['evidences', 0, 'status_approve'],
                                        key: 'status_approve',
                                        render: (val: string | null) => val ?? 'Belum di-approve',
                                    },
                                ]
                                : [
                                    {
                                        title: 'Nama Asset',
                                        dataIndex: 'equipment_nama',
                                        key: 'equipment_nama',
                                    },
                                    {
                                        title: 'Manufaktur',
                                        dataIndex: 'equipment_manufaktur',
                                        key: 'equipment_manufaktur',
                                    },
                                    {
                                        title: 'Kondisi',
                                        dataIndex: 'kondisi_barang',
                                        key: 'kondisi_barang',
                                    },
                                    {
                                        title: 'Jumlah',
                                        dataIndex: 'equipment_quantity',
                                        key: 'equipment_quantity',
                                    },
                                    {
                                        title: 'Pelaporan',
                                        dataIndex: 'approval_namaBarang',
                                        key: 'approval_namaBarang',
                                    },
                                    {
                                        title: 'Status Approve',
                                        dataIndex: 'status_approve',
                                        key: 'status_approve',
                                        render: (val: string | null) => val ?? 'Belum di-approve',
                                    },
                                ]
                        }
                    />
                </Spin>
            </Modal>
        </>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    root: { minHeight: '100vh', overflowX: 'hidden' },
    main: { marginLeft: 200 },
    content: { background: '#ECF2FF', padding: 20, overflowY: 'auto' },
    inner: { maxWidth: 1200, margin: '0 auto' },

    cardHead: {
        color: '#132831',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        fontWeight: 500,
    },
    chartCard: {
        background: '#FFFFFF',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },

    statCard: {
        background: '#FFFFFF',
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden',
    },
    statValue: {
        color: '#132831',
        margin: 0,
        position: 'relative',
        zIndex: 1,
    },
    statLabel: {
        color: 'rgba(19,40,49,0.65)',
        position: 'relative',
        zIndex: 1,
    },
    cardIconWrapper: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 60,
        height: 60,
        overflow: 'hidden',
        zIndex: 0,
    },
    cardIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        opacity: 1,
    },

    activitiesHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#132831',
    },
    listItem: {
        padding: '12px 16px',
        borderBottom: '1px solid #e8e8e8',
    },
    listTitle: {
        color: '#132831',
        marginBottom: 4,
    },
};

export default Dashboard;
