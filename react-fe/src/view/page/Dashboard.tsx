// src/pages/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';
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
import { IconDatabase, IconDeviceAnalytics, IconUserX } from '@tabler/icons-react';
import { IconFileText } from '@tabler/icons-react';

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
    id: string;
    nama: string;
    kategori: string;
    status: 'Layak' | string;
    jumlah: number;
}

// Stat cards data: first uses an image, the rest use Tabler icons
const stats = [
    {
        label: 'Total Pelaporan',
        value: 43,
        icon: (
            <img
                src="/assets/analysis-graph.png"
                alt="Total Pelaporan"
                width={60}
                height={60}
            />
        ),
    },
    {
        label: 'Total Asset Tercatat',
        value: 10,
        icon: <img
            src="/assets/job-search.png"
            alt="Total Pelaporan"
            width={60}
            height={60}
        />,
    },
    {
        label: 'Total Asset Layak',
        value: 10,
        icon: <img
            src="/assets/planning.png"
            alt="Total Pelaporan"
            width={60}
            height={60}
        />,
    },
    {
        label: 'Total Asset Tidak Layak',
        value: 20,
        icon: <img
            src="/assets/teamwork.png"
            alt="Total Pelaporan"
            width={60}
            height={60}
        />,
    },
];

const Dashboard: React.FC = () => {
    const [approvalData, setApprovalData] = useState<Approval[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [loadingAssets, setLoadingAssets] = useState(false);

    // Fetch both approvals and assets
    useEffect(() => {
        setLoadingChart(true);
        setLoadingAssets(true);
        Promise.all([
            fetch('http://localhost:3001/approval-pelaporan').then(r => r.json()),
            fetch('http://localhost:3001/assets').then(r => r.json()),
        ])
            .then(([approvals, assetList]) => {
                setApprovalData(approvals);
                setAssets(assetList);
            })
            .catch(err => {
                console.error(err);
                message.error('Gagal mengambil data');
            })
            .finally(() => {
                setLoadingChart(false);
                setLoadingAssets(false);
            });
    }, []);

    // 7-day area chart
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
            const start = new Date(day); start.setHours(0, 0, 0, 0);
            const end = new Date(day); end.setHours(23, 59, 59, 999);
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
        yaxis: {},
        dataLabels: { enabled: false },
        legend: { position: 'top' },
        fill: { opacity: 0.8 },
        colors: ['#52c41a', '#f5222d', '#d9d9d9'],
    };

    // Radial bar: percentage of Layak units
    const totalJumlah = useMemo(() => assets.reduce((sum, a) => sum + a.jumlah, 0), [assets]);
    const layakJumlah = useMemo(
        () => assets.filter(a => a.status === 'Layak').reduce((sum, a) => sum + a.jumlah, 0),
        [assets]
    );
    const layakPercent = totalJumlah > 0
        ? Math.round((layakJumlah / totalJumlah) * 100)
        : 0;

    const radialSeries = [layakPercent];
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
                        formatter: val => `${val}%`,
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

    // Recent 4 pelaporan
    const recentActivities = useMemo(() => {
        return approvalData
            .slice()
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .slice(0, 4)
            .map(item => ({
                title: `Pelaporan ${item.namaBarang} oleh ${item.user_maker}`,
                date: new Date(item.created_at).toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
            }));
    }, [approvalData]);

    return (
        <Layout style={styles.root}>
            <Sidebar />
            <Layout style={styles.main}>
                <Navbar />
                <Content style={styles.content}>
                    <div style={styles.inner}>

                        {/* Stats Cards */}
                        <Row gutter={[24, 24]}>
                            {stats.map((s, i) => (
                                <Col xs={24} sm={12} md={6} key={i}>
                                    <Card
                                        style={styles.statCard}
                                        bodyStyle={{ padding: 20, position: 'relative' }}
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

                        {/* Approval Chart (7 Hari Terakhir) */}
                        <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
                            <Col xs={24} lg={16}>
                                <Card
                                    title="Approval Chart (7 Hari Terakhir)"
                                    style={styles.chartCard}
                                    headStyle={styles.cardHead}
                                    bodyStyle={{ minHeight: 260 }}
                                >
                                    <Spin spinning={loadingChart}>
                                        <Chart
                                            options={areaOptions}
                                            series={series}
                                            type="area"
                                            height={260}
                                        />
                                    </Spin>
                                </Card>
                            </Col>
                            <Col xs={24} lg={8}>
                                <Card
                                    title="Persentase Asset Layak"
                                    style={styles.chartCard}
                                    headStyle={styles.cardHead}
                                    bodyStyle={{ textAlign: 'center', minHeight: 260, paddingTop: 40 }}
                                >
                                    {loadingAssets ? (
                                        <Spin />
                                    ) : (
                                        <>
                                            <Chart
                                                options={radialOptions}
                                                series={radialSeries}
                                                type="radialBar"
                                                height={200}
                                            />
                                            <Text style={{ display: 'block', marginTop: 16 }}>
                                                {layakJumlah} dari {totalJumlah} unit
                                            </Text>
                                        </>
                                    )}
                                </Card>
                            </Col>
                        </Row>

                        {/* Recent Pelaporan */}
                        <Row gutter={[24, 24]} style={{ marginTop: 24, marginBottom: 24 }}>
                            <Col xs={24} md={12}>
                                <Card
                                    title={
                                        <div style={styles.activitiesHeader}>
                                            <span>Recent Pelaporan</span>
                                            <Link to="/approval-pelaporan">View All</Link>
                                        </div>
                                    }
                                    style={styles.chartCard}
                                    headStyle={styles.cardHead}
                                    bodyStyle={{ padding: 10 }}
                                >
                                    <List
                                        itemLayout="horizontal"
                                        dataSource={recentActivities}
                                        split={false}
                                        renderItem={item => (
                                            <List.Item style={styles.listItem}>
                                                <List.Item.Meta
                                                    title={<Text style={styles.listTitle}>{item.title}</Text>}
                                                    description={<Text type="secondary">{item.date}</Text>}
                                                />
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card
                                    title="Monthly Active Users"
                                    style={styles.chartCard}
                                    headStyle={styles.cardHead}
                                    bodyStyle={{ minHeight: 240 }}
                                />
                            </Col>
                        </Row>
                    </div>
                </Content>
            </Layout>
        </Layout>
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
