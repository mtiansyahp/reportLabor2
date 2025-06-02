// src/pages/PelaporanBarang.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
    Layout,
    Card,
    Form,
    Select,
    Radio,
    Button,
    Input,
    Upload,
    Modal,
    Spin,
    message,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { UploadFile, UploadChangeParam } from 'antd/es/upload/interface';
import Sidebar from '../component/sidebar/Sidebar';
import Navbar from '../component/navbar/Navbar';
import { api } from '../../api/apiAxios';

const { Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

interface Asset {
    id: string;
    nama: string;
    manufaktur: string;
    jumlah: number;
    status: string;
    umur: string;
    riwayat: string;
    created_at: string;
}

export default function PelaporanBarang() {
    const [data, setData] = useState<Asset[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const perPage = 50;

    const [category, setCategory] = useState<string>();
    const [item, setItem] = useState<string>();
    const [riwayat, setRiwayat] = useState<string>();
    const [kelayakan, setKelayakan] = useState<string>();
    const [catatan, setCatatan] = useState<string>('');
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');

    const [submitting, setSubmitting] = useState(false);

    // role user (pegawai atau atasan)
    const [userRole, setUserRole] = useState<string>('pegawai');
    const [userName, setUserName] = useState<string>('admin');
    useEffect(() => {
        const role = localStorage.getItem('role');
        const name = localStorage.getItem('name');
        if (role) {
            setUserRole(role);
        }
        if (name) {
            setUserName(name);
        }
    }, []);

    const fetchAssets = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/equipment`, {
                params: { page, per_page: perPage, search },
            });
            const list = res.data.data;
            const assets: Asset[] = list.map((e: any) => ({
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

    useEffect(() => {
        fetchAssets();
    }, []);

    const manufakturs = useMemo(
        () => Array.from(new Set(data.map(a => a.manufaktur))),
        [data]
    );
    const filteredItems = useMemo(
        () => data.filter(a => a.manufaktur === category),
        [data, category]
    );

    const getBase64 = (file: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = err => reject(err);
        });

    const handleUploadChange = ({ fileList }: UploadChangeParam<UploadFile>) => {
        setFileList(fileList);
    };

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as Blob);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewTitle(file.name || 'Preview');
        setPreviewVisible(true);
    };

    const handleCancel = () => setPreviewVisible(false);

    const onFinish = async () => {
        // if (fileList.length === 0) {
        //     message.error('Mohon unggah minimal satu foto evidence.');
        //     return;
        // }

        setSubmitting(true);

        const selectedAsset = data.find(
            a => a.nama === item && a.manufaktur === category
        );
        if (!selectedAsset) {
            message.error('Barang tidak ditemukan');
            setSubmitting(false);
            return;
        }

        const evidenceList = (fileList && fileList.length > 0)
            ? fileList.map(f => ({
                name: f.name,
                url: f.url || f.thumbUrl || null,
                user_maker: userName,
                status_approve: 'menunggu approve',
                approval_sequence: userRole === 'pegawai' ? 1 : 0,
                created_at: new Date().toISOString(),
            }))
            : [{
                name: selectedAsset.nama,
                url: null,
                user_maker: userName,
                status_approve: 'menunggu approve',
                approval_sequence: userRole === 'pegawai' ? 1 : 0,
                created_at: new Date().toISOString(),
            }];


        const approvalPayload = {
            manufaktur: selectedAsset.manufaktur,
            namaBarang: selectedAsset.nama,
            riwayat,
            kelayakan,
            catatan,
            evidence: evidenceList,
        };

        try {
            await api.post('/approval-pelaporan', approvalPayload);
            Modal.success({
                title: 'Berhasil',
                content: 'Laporan berhasil dikirim.',
                zIndex: 1050,
                getContainer: () => document.body,
            });
        } catch (err: any) {
            Modal.error({
                title: 'Gagal',
                content: 'Terjadi kesalahan saat mengirim laporan',
                zIndex: 1050,
                getContainer: () => document.body,
            });
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <Layout style={styles.root}>
            <Sidebar />
            <Layout style={styles.main}>
                <Navbar />
                <Content style={styles.content}>
                    <Spin spinning={loading || submitting}>
                        <Card
                            title="Pelaporan Barang"
                            headStyle={styles.cardHead}
                            style={styles.card}
                        >
                            <Form layout="vertical" onFinish={onFinish}>
                                {/* Manufaktur */}
                                <Form.Item
                                    label="Manufaktur"
                                    name="category"
                                    rules={[{ required: true, message: 'Pilih manufaktur' }]}
                                    style={styles.formItem}
                                >
                                    <Select
                                        placeholder="Pilih manufaktur"
                                        value={category}
                                        onChange={val => {
                                            setCategory(val);
                                            setItem(undefined);
                                        }}
                                        allowClear
                                    >
                                        {manufakturs.map(mf => (
                                            <Option key={mf} value={mf}>
                                                {mf}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* Nama Barang */}
                                <Form.Item
                                    label="Nama Barang"
                                    name="item"
                                    rules={[{ required: true, message: 'Pilih nama barang' }]}
                                    style={styles.formItem}
                                >
                                    <Select
                                        placeholder="Pilih nama barang"
                                        disabled={!category}
                                        allowClear
                                        value={item}
                                        onChange={val => setItem(val)}
                                    >
                                        {filteredItems.map(it => (
                                            <Option key={it.id} value={it.nama}>
                                                {it.nama}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                {/* Riwayat Rusak */}
                                <Form.Item
                                    label="Riwayat rusak dalam 8 bulan terakhir?"
                                    name="riwayat"
                                    rules={[{ required: true, message: 'Pilih salah satu' }]}
                                    style={styles.formItem}
                                >
                                    <Radio.Group
                                        value={riwayat}
                                        onChange={e => setRiwayat(e.target.value)}
                                    >
                                        <Radio value="sangat-sering">Sangat Sering</Radio>
                                        <Radio value="pernah">Pernah</Radio>
                                        <Radio value="tidak-sering">Tidak Sering</Radio>
                                        <Radio value="tidak-pernah">Tidak Pernah</Radio>
                                    </Radio.Group>
                                </Form.Item>

                                {/* Nilai Kelayakan */}
                                <Form.Item
                                    label="Nilai kelayakan barang?"
                                    name="kelayakan"
                                    rules={[{ required: true, message: 'Pilih salah satu' }]}
                                    style={styles.formItem}
                                >
                                    <Radio.Group
                                        value={kelayakan}
                                        onChange={e => setKelayakan(e.target.value)}
                                    >
                                        <Radio value="sangat-layak">Sangat Layak</Radio>
                                        <Radio value="layak">Layak</Radio>
                                        <Radio value="tidak">Tidak</Radio>
                                        <Radio value="tidak-layak">Tidak Layak</Radio>
                                    </Radio.Group>
                                </Form.Item>

                                {/* Catatan */}
                                <Form.Item
                                    label="Catatan Riwayat Barang/Asset"
                                    name="catatan"
                                    style={styles.formItem}
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Masukkan catatan..."
                                        value={catatan}
                                        onChange={e => setCatatan(e.target.value)}
                                    />
                                </Form.Item>

                                {/* Foto Evidence */}
                                <Form.Item label="Foto Evidence Barang" style={styles.formItem}>
                                    <Upload
                                        listType="picture-card"
                                        fileList={fileList}
                                        beforeUpload={() => false}
                                        onChange={handleUploadChange}
                                        onPreview={handlePreview}
                                    >
                                        {fileList.length < 1 && '+ Upload'}
                                    </Upload>
                                </Form.Item>

                                {/* Preview Modal */}
                                <Modal
                                    visible={previewVisible}
                                    title={previewTitle}
                                    footer={null}
                                    onCancel={handleCancel}
                                    centered
                                    bodyStyle={{ padding: 16, textAlign: 'center' }}
                                    closeIcon={<CloseOutlined />}
                                >
                                    <img
                                        alt="preview"
                                        style={{
                                            width: '100%',
                                            maxHeight: '70vh',
                                            objectFit: 'contain',
                                        }}
                                        src={previewImage}
                                    />
                                </Modal>

                                {/* Submit */}
                                <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={submitting}
                                    >
                                        Kirim Laporan
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Spin>
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
    formItem: { marginBottom: 16 },
};
