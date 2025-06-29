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
    InputNumber,
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
    nama: string; // nama barang
    manufaktur: string; // nama manufaktur
    jumlah: number; // gausah karena dari asset sudah ada
    status: string; // ini tidak diisi karena, pertama buat itu lagsung keisi belum di approve
    umur: string; // umur sudah ada di asset
    riwayat: string; // riwayat adalah : nilai kelayakan barang yang ada di frontend
    created_at: string; // karena created itu sudah default disii dengan tanggal sekarang
}

export default function PelaporanBarang() {
    const [data, setData] = useState<Asset[]>([]); // ini untuk menyimpan data asset yang diambil dari API
    const [totalRows, setTotalRows] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const perPage = 100; // ini buat menampilkan data per halaman

    const [category, setCategory] = useState<string>();    // category adalah manufaktur yang dipilih oleh user, misal: acer, asus, lenovo, dll
    const [item, setItem] = useState<string>(); // item adalah nama barang yang dipilih oleh user, misal: laptop, printer, dll
    const [riwayat, setRiwayat] = useState<string>(); // riwayat adalah riwayat rusak barang yang diinputkan oleh user, bisa sangat sering, pernah, tidak sering, atau tidak pernah
    const [kelayakan, setKelayakan] = useState<number | null>(null); // kelayakan adalah nilai kelayakan barang yang diinputkan oleh user, bisa 1-100 persen
    const [catatan, setCatatan] = useState<string>(''); // catatan adalah catatan yang diinputkan oleh user, bisa kosong atau diisi
    const [fileList, setFileList] = useState<UploadFile[]>([]); // fileList untuk menyimpan daftar file yang diupload (gambar evidence)

    const [previewVisible, setPreviewVisible] = useState(false); // untuk mengontrol visibilitas modal preview gambar (untuk zoom atau melihat preview)
    const [previewImage, setPreviewImage] = useState<string>(''); // untuk menyimpan URL gambar yang akan ditampilkan di modal preview
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
    ); // ini untuk mendapatkan daftar manufaktur unik dari data asset
    const filteredItems = useMemo(
        () => data.filter(a => a.manufaktur === category),
        [data, category]
    ); // ini untuk mendapatkan daftar barang yang sesuai dengan manufaktur yang dipilih

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
    // fungsi ini untuk menangani perubahan pada daftar file yang diupload

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as Blob);
        }
        setPreviewImage(file.url || (file.preview as string));
        setPreviewTitle(file.name || 'Preview');
        setPreviewVisible(true);
    };
    // fungsi ini untuk menangani preview gambar ketika user mengklik gambar di daftar upload

    const handleCancel = () => setPreviewVisible(false);
    // fungsi ini untuk menutup modal preview gambar

    const onFinish = async () => { // fungsi ini untuk menangani submit form pelaporan barang
        // if (fileList.length === 0) {
        //     message.error('Mohon unggah minimal satu foto evidence.');
        //     return;
        // }

        setSubmitting(true);

        const selectedAsset = data.find(
            a => a.nama === item && a.manufaktur === category
        );
        // cari asset yang sesuai dengan nama barang dan manufaktur yang dipilih
        if (!selectedAsset) {
            message.error('Barang tidak ditemukan');
            setSubmitting(false);
            return;
        }
        // jika tidak ditemukan, tampilkan pesan error

        const evidenceList = (fileList && fileList.length > 0) // satu fungsi ini untuk mengisi data tb evidence yang udah diisi di frontend ke backend/ database
            ? fileList.map(f => ({
                name: f.name, // nama file yang diupload
                url: f.url || f.thumbUrl || null, // URL file yang diupload, jika ada
                user_maker: userName, // nama user yang membuat laporan
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
        }; // untuk mengisi data approval yang akan dikirim ke backend

        try {
            await api.post('/approval-pelaporan', approvalPayload); // kirim data approval ke backend
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
                                <Form.Item label="Manufaktur" name="category" rules={[{ required: true }]}>
                                    <Select
                                        placeholder="Pilih manufaktur"
                                        allowClear
                                        value={category}
                                        onChange={val => {
                                            setCategory(val);
                                            setItem(undefined);
                                        }}
                                        // refetch saat dropdown dibuka
                                        onDropdownVisibleChange={open => {
                                            if (open) fetchAssets();
                                        }}
                                    >
                                        {manufakturs.map(mf => (
                                            <Option key={mf} value={mf}>{mf}</Option>
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
                                    label="Nilai kelayakan barang (%)"
                                    name="kelayakan"
                                    rules={[{ required: true, message: 'Masukkan nilai antara 1 hingga 100' }]}
                                    style={styles.formItem}
                                >
                                    <InputNumber
                                        min={1}
                                        max={100}
                                        value={kelayakan}
                                        onChange={value => setKelayakan(value)}
                                        addonAfter="%"
                                        style={{ width: '100%' }}
                                    />
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
