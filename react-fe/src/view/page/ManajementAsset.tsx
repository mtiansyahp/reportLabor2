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
import { DatePicker } from 'antd'; // Import DatePicker dari antd
import DataTable, { TableColumn } from 'react-data-table-component'; // Komponen DataTable untuk menampilkan tabel
import Sidebar from '../component/sidebar/Sidebar'; // import Sidebar component
import Navbar from '../component/navbar/Navbar';

import { api } from '../../api/apiAxios';  // ← gunakan axios instance dengan bearer token

const { Content } = Layout; // Layout komponen utama
const { Search } = Input; // Komponen pencarian dari antd
const { Title, Text } = Typography; // Typography untuk teks dan judul
const { Option } = Select; // Pilihan untuk Select

interface Asset { // Definisi tipe data untuk aset
    id: string;
    nama: string;
    manufaktur: string;
    jumlah: number;
    status: string;
    umur: string;
    riwayat: string;
    created_at: Date;
}


type AssetForm = Omit<Asset, 'id'>; // Tipe data untuk form aset, menghilangkan 'id' karena tidak perlu diinputkan

export default function ManajemenAset() { // Komponen utama Manajemen Aset
    const [data, setData] = useState<Asset[]>([]); // Daftar aset yang akan ditampilkan
    const fetchedRef = useRef(false); // Menandai apakah data sudah diambil dari API
    const [filterText, setFilterText] = useState(''); // Teks filter untuk pencarian aset
    const [isAddModalVisible, setIsAddModalVisible] = useState(false); // Status modal untuk menambah aset
    const [isEditModalVisible, setIsEditModalVisible] = useState(false); // Status modal untuk mengedit aset
    const [isViewModalVisible, setIsViewModalVisible] = useState(false); // Status modal untuk melihat detail aset
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null); // Aset yang dipilih untuk dilihat atau diedit
    const [currentPage, setCurrentPage] = useState(1); // Halaman saat ini untuk pagination
    const [totalRows, setTotalRows] = useState(0); // Total baris data untuk pagination
    const [perPage] = useState(10); // Jumlah item per halaman untuk pagination
    const [loading, setLoading] = useState(false); // Status loading saat mengambil data dari API

    const [resultModal, setResultModal] = useState({ // Status modal hasil operasi
        visible: false, // Menandai apakah modal hasil operasi terlihat
        success: true, // Status sukses atau gagal operasi
        message: '',
    });

    // const [filterText, setFilterText] = useState('');


    const [form] = Form.useForm<Asset>(); // Form untuk menambah atau mengedit aset

    // Ambil data dari API Laravel pada mount
    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchAssets(currentPage, filterText);
        }, 300); // Debounce 300ms untuk pencarian

        return () => clearTimeout(timeout); // Bersihkan timeout saat komponen unmount atau filterText berubah
    }, [currentPage, filterText]); // Mengambil data saat currentPage atau filterText berubah

    const handlePageChange = (page: number) => { // Fungsi untuk menangani perubahan halaman pada pagination
        fetchAssets(page, filterText); // Ambil data aset berdasarkan halaman yang dipilih
    };

    // useEffect(() => {
    //     const timeout = setTimeout(() => {
    //         fetchAssets(1, filterText);
    //     }, 500); // debounce 500ms

    //     return () => clearTimeout(timeout);
    // }, [filterText]);




    const fetchAssets = async (page = 1, search = '') => { // Fungsi untuk mengambil data aset dari API
        setLoading(true); // Menandai loading saat mengambil data
        try {
            const res = await api.get(`/equipment`, { // Menggunakan axios instance yang sudah diatur dengan token
                params: { // Parameter untuk API
                    page,
                    per_page: perPage,
                    search,
                },
            });

            const list = res.data.data; // Daftar aset yang diambil dari API
            const assets: Asset[] = list.map((e: { unique_id: any; nama_item: any; manufaktur: any; quantity: any; kondisi_barang: any; umur: any; created_at: any; }) => ({ // Mapping data dari API ke tipe Asset
                id: e.unique_id, // Menggunakan unique_id sebagai ID
                nama: e.nama_item, // Nama item dari API
                manufaktur: e.manufaktur, // Manufaktur dari API
                jumlah: e.quantity ?? 0, // Jumlah item, default 0 jika tidak ada
                status: e.kondisi_barang, // Status barang dari API
                umur: e.umur, // Umur barang dari API
                riwayat: `${e.umur} tahun`, // Riwayat umur barang
                created_at: e.created_at, // Tanggal dibuat dari API
            }));

            setData(assets); // Set data aset yang diambil dari API
            setTotalRows(res.data.meta.total); // Set total baris data untuk pagination
            setCurrentPage(page); // Set halaman saat ini
        } catch (err) {
            console.error(err);
            message.error('Gagal memuat data equipment');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo( // Menggunakan useMemo untuk mengoptimalkan filter data
        () =>
            data.filter(asset => // Memfilter data berdasarkan teks pencarian
                asset.nama.toLowerCase().includes(filterText.toLowerCase()) //  Mencocokkan nama aset dengan teks pencarian
            ),
        [data, filterText] // Dependensi useMemo, akan dihitung ulang jika data atau filterText berubah
    );

    const columns: TableColumn<Asset>[] = [ // Definisi kolom untuk DataTable
        { name: 'Nama Barang', selector: row => row.nama, sortable: true }, // Nama barang, dapat diurutkan
        {
            name: 'Manufaktur', // Manufaktur, dapat diurutkan
            selector: row => row.manufaktur, // Mengambil manufaktur dari aset
            sortable: true, // Dapat diurutkan
            right: true, // Penempatan teks di kanan
        },
        {
            name: 'Jumlah', // Jumlah barang, dapat diurutkan
            selector: row => row.jumlah, // Mengambil jumlah dari aset
            sortable: true, // Dapat diurutkan
            right: true, // Penempatan teks di kanan
        },
        {
            name: 'Status', // Status barang, dapat diurutkan
            selector: row => row.status, // Mengambil status dari aset
            cell: row => ( // Menampilkan status dengan tag berwarna
                <Tag color={row.status === 'Baik' ? 'green' : 'red'}>
                    {row.status}
                </Tag> // Menggunakan tag untuk menampilkan status
            ),
            sortable: true,
        },
        {
            name: 'Umur', // Umur barang dalam bulan, dapat diurutkan
            selector: row => `${row.umur} Bulan`, // Mengambil umur dari aset dan menampilkannya dalam format "X Bulan"
            sortable: true
        },
        {
            name: 'Created At', // Tanggal dibuat, tidak dapat diurutkan
            selector: (row) => new Date(row.created_at).toLocaleDateString() // Mengambil tanggal dibuat dan mengubahnya ke format lokal

        },
        {
            name: 'Action', // Aksi untuk setiap baris, tidak dapat diurutkan
            cell: row => ( // Menampilkan ikon aksi untuk setiap baris
                <Space size="middle"> 
                    <EyeOutlined
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                            setSelectedAsset(row); // Set aset yang dipilih untuk dilihat
                            setIsViewModalVisible(true); // Tampilkan modal untuk melihat detail aset
                        }}
                    />
                    <EditOutlined // Ikon untuk mengedit aset
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
                            }); // Set nilai form dengan data aset yang dipilih


                            setIsEditModalVisible(true); // Tampilkan modal untuk mengedit aset
                        }}
                    />
                    <DeleteOutlined // Ikon untuk menghapus aset
                        style={{ cursor: 'pointer', color: 'red' }} // Menggunakan warna merah untuk ikon hapus
                        onClick={() => { // Fungsi untuk menghapus aset
                            Modal.confirm({ // Konfirmasi sebelum menghapus
                                title: 'Hapus Item',
                                content: `Yakin ingin menghapus "${row.nama}"?`,
                                onOk: async () => { // Jika pengguna mengkonfirmasi
                                    try { // Mengirim permintaan DELETE ke API untuk menghapus aset
                                        await api.delete(`/equipment/${row.id}`);
                                        setData(prev => prev.filter(a => a.id !== row.id));
                                        message.success('Item dihapus');
                                    } catch (err) { // Menangani kesalahan saat menghapus
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

    const openAddModal = () => { // Fungsi untuk membuka modal tambah aset
        form.resetFields(); // Mengatur ulang form sebelum membuka modal
        setIsAddModalVisible(true); // Menampilkan modal tambah aset
    };

    const handleAdd = async () => { // Fungsi untuk menangani penambahan aset
        try { // Validasi form sebelum mengirim data
            const values = await form.validateFields() as AssetForm; // Mengambil nilai dari form dan mengasumsikan tipe AssetForm

            const response = await api.post('/equipment', { // Mengirim permintaan POST ke API untuk menambahkan aset
                nama_item: values.nama,
                manufaktur: values.manufaktur,
                quantity: values.jumlah,
                kondisi_barang: values.status,
                umur: values.umur,
                created_at: values.created_at, // kirim manual tanggal buat
            }); // ← menggunakan axios instance yang sudah diatur dengan token

            const item = response.data.data; // Data aset yang baru ditambahkan dari respons API

            const newAsset: Asset = { // Membuat objek aset baru dengan data yang diterima dari API
                id: item.unique_id,
                nama: item.nama_item,
                manufaktur: item.manufaktur,
                jumlah: item.quantity,
                status: item.kondisi_barang,
                umur: item.umur,
                riwayat: `${item.umur} tahun`,
                created_at: item.created_at,
            }; // Membuat objek aset baru dengan data yang diterima dari API

            setData(prev => [newAsset, ...prev]); // Menambahkan aset baru ke daftar aset yang ada
            setIsAddModalVisible(false); // Menutup
            message.success('Item ditambahkan');
            showResultModal(true, 'Item berhasil ditambahkan');
        } catch (err) {
            message.error('Gagal menambahkan item');
            showResultModal(false, 'Gagal menambahkan item');
            console.error(err);

        }
    };





    const handleEdit = async () => { // Fungsi untuk menangani pengeditan aset
        try {
            const values = await form.validateFields(); // Validasi form sebelum mengirim data

            if (selectedAsset) { // Jika ada aset yang dipilih untuk diedit
                await api.put(`/equipment/${selectedAsset.id}`, { // Mengirim permintaan PUT ke API untuk memperbarui aset
                    nama_item: values.nama,
                    manufaktur: values.manufaktur,
                    quantity: values.jumlah,
                    kondisi_barang: values.status,
                    umur: values.umur,
                });

                const updatedAsset: Asset = { // Membuat objek aset yang diperbarui
                    id: selectedAsset.id,
                    nama: values.nama,
                    manufaktur: values.manufaktur,
                    jumlah: values.jumlah,
                    status: values.status,
                    umur: values.umur,
                    riwayat: `${values.umur} tahun`,
                    created_at: selectedAsset.created_at, // retain original // created_at
                };

                setData(prev => // Memperbarui daftar aset dengan aset yang diperbarui
                    prev.map(a =>
                        a.id === selectedAsset.id ? updatedAsset : a // Mengganti aset yang diperbarui dengan yang lama
                    )
                );

                setIsEditModalVisible(false); // Menutup modal edit setelah berhasil memperbarui
                message.success('Item diperbarui'); // Menampilkan pesan sukses
                showResultModal(true, 'Item berhasil diperbarui');
            }
        } catch (err) {
            showResultModal(false, 'Gagal memperbarui item'); // Menampilkan pesan gagal memperbarui
            message.error('Gagal memperbarui item');
            console.error(err);
        }
    };

    const showResultModal = (success: boolean, messageText: string) => { // Fungsi untuk menampilkan modal hasil operasi
        setResultModal({ // Mengatur status modal hasil operasi
            visible: true, // Menandai modal hasil operasi terlihat
            success, // Status sukses atau gagal operasi
            message: messageText, // Pesan yang akan ditampilkan di modal
        });
    };


    const handleViewCancel = () => setIsViewModalVisible(false); // Fungsi untuk menutup modal lihat detail aset

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
                        <DataTable // Komponen DataTable untuk menampilkan daftar aset
                            columns={columns} // Kolom yang akan ditampilkan di tabel
                            data={data} // Data yang akan ditampilkan di tabel
                            pagination // Mengaktifkan pagination
                            paginationServer // Menggunakan server-side pagination
                            paginationTotalRows={totalRows} // Total baris data untuk pagination
                            onChangePage={handlePageChange} // Fungsi untuk menangani perubahan halaman
                            paginationPerPage={perPage} // Jumlah item per halaman
                            progressPending={loading} // Menampilkan indikator loading saat data sedang diambil
                            highlightOnHover // Menyoroti baris saat hover
                            pointerOnHover // Menampilkan kursor pointer saat hover
                            responsive // Membuat tabel responsif
                            noHeader // Menyembunyikan header tabel
                        />

                    </Card> 

                    {/* Add Modal */}
                    <Modal // Modal untuk menambah aset
                        title="Tambah Item" // Judul modal
                        visible={isAddModalVisible} // Status modal terlihat
                        onCancel={() => setIsAddModalVisible(false)} // Fungsi untuk menutup modal
                        onOk={handleAdd} // Fungsi untuk menangani penambahan aset
                        centered // Menampilkan modal di tengah layar
                    >
                        <Form form={form} layout="vertical"> // Form untuk menambah aset
                            <Form.Item // Nama barang
                                name="nama"
                                label="Nama Barang"
                                rules={[{ required: true, message: 'Masukkan nama barang' }]}
                            >
                                <Input /> // Input untuk nama barang
                            </Form.Item>

                            <Form.Item // Manufaktur
                                name="manufaktur"
                                label="Manufaktur"
                                rules={[{ required: true, message: 'Masukkan nama manufaktur' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item // Jumlah barang
                                name="jumlah"
                                label="Jumlah"
                                rules={[{ required: true, message: 'Masukkan jumlah' }]} // Validasi untuk jumlah barang
                            >
                                <InputNumber min={1} style={{ width: '100%' }} /> // Input untuk jumlah barang, minimal 1
                            </Form.Item> 

                            <Form.Item // Umur barang
                                name="umur"
                                label="Umur (bulan)"
                                rules={[{ required: true, message: 'Masukkan umur barang' }]} //    Validasi untuk umur barang
                            >
                                <InputNumber min={1} style={{ width: '100%' }} /> // Input untuk umur barang, minimal 1
                            </Form.Item>

                            <Form.Item // Status barang
                                name="status"
                                label="Status"
                                rules={[{ required: true, message: 'Pilih status barang' }]} // Validasi untuk status barang
                            >
                                <Select placeholder="Pilih status"> // Select untuk memilih status barang   
                                    <Option value="Baik">Baik</Option> // Pilihan status "Baik"
                                    <Option value="Rusak">Rusak</Option> // Pilihan status "Rusak"
                                </Select>
                            </Form.Item>
                            <Form.Item // Tanggal dibuat
                                name="created"
                                label="Tanggal Dibuat"
                                rules={[{ required: true, message: 'Masukkan tanggal dibuat' }]}
                            >
                                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} /> // Input untuk tanggal dibuat, format YYYY-MM-DD
                            </Form.Item>

                        </Form>
                    </Modal> 


                    {/* Edit Modal */}
                    <Modal // Modal untuk mengedit aset
                        title="Edit Item" // Judul modal
                        visible={isEditModalVisible}        // Status modal terlihat
                        onCancel={() => setIsEditModalVisible(false)} // Fungsi untuk menutup modal
                        onOk={handleEdit} // Fungsi untuk menangani pengeditan aset
                        centered // Menampilkan modal di tengah layar
                    >
                        <Form form={form} layout="vertical"> // Form untuk mengedit aset
                            <Form.Item // Nama barang
                                name="nama"
                                label="Nama Barang"
                                rules={[{ required: true, message: 'Masukkan nama barang' }]}
                            >
                                <Input /> // Input untuk nama barang
                            </Form.Item>

                            <Form.Item // Manufaktur
                                name="manufaktur"
                                label="Manufaktur"
                                rules={[{ required: true, message: 'Masukkan nama manufaktur' }]} // Validasi untuk manufaktur  
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item // Jumlah barang
                                name="jumlah"
                                label="Jumlah"
                                rules={[{ required: true, message: 'Masukkan jumlah' }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} /> // Input untuk jumlah barang, minimal 1
                            </Form.Item>

                            <Form.Item // Umur barang
                                name="umur"
                                label="Umur (bulan)"
                                rules={[{ required: true, message: 'Masukkan umur barang' }]} // Validasi untuk umur barang
                            >
                                <InputNumber min={1} style={{ width: '100%' }} /> // Input untuk umur barang, minimal 1
                            </Form.Item>

                            <Form.Item // Status barang
                                name="status"
                                label="Status"
                                rules={[{ required: true, message: 'Pilih status barang' }]}
                            >
                                <Select placeholder="Pilih status">
                                    <Option value="Baik">Baik</Option>
                                    <Option value="Rusak">Rusak</Option>
                                </Select>// Select untuk memilih status barang
                            </Form.Item>
                        </Form>
                    </Modal>


                    {/* View Modal */}
                    <Modal // Modal untuk melihat detail aset
                        visible={isViewModalVisible} // Status modal terlihat
                        footer={null} // Tidak ada footer pada modal ini
                        closable={false} // Menyembunyikan tombol close bawaan
                        centered // Menampilkan modal di tengah layar
                        bodyStyle={{ padding: 0 }} // Mengatur padding body modal menjadi 0
                        className="custom-view-modal" // Kelas CSS khusus untuk modal ini
                        onCancel={handleViewCancel} // Fungsi untuk menutup modal lihat detail aset
                    >
                        <div style={styles.viewHeader}> //  Header modal untuk melihat detail aset
                            <Title level={4} style={{ margin: 0 }}>
                                Detail Item
                            </Title>
                            <CloseOutlined onClick={handleViewCancel} style={styles.viewClose} />
                        </div>
                        <div style={styles.viewContent}> // Konten modal untuk melihat detail aset
                            {selectedAsset && ( // Jika ada aset yang dipilih, tampilkan detailnya
                                <>
                                    <div style={styles.viewSection}> // Bagian untuk menampilkan detail aset
                                        <Text type="secondary" style={styles.viewLabel}> //  Label untuk nama barang
                                            Nama Barang /
                                        </Text>
                                        <Text style={styles.viewValue}>{selectedAsset.nama}</Text> // Menampilkan nama barang
                                    </div>

                                    <div style={styles.viewSection}> // Bagian untuk menampilkan manufaktur aset
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Manufaktur
                                        </Text>
                                        <Text style={styles.viewValue}>{selectedAsset.manufaktur}</Text>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Jumlah
                                        </Text> // Menampilkan jumlah aset
                                        <Text style={styles.viewValue}>{selectedAsset.jumlah}</Text>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Umur
                                        </Text> // Menampilkan umur aset
                                        <Text style={styles.viewValue}>{selectedAsset.umur} Bulan</Text>
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Status
                                        </Text> // Menampilkan status aset
                                        <Tag color={selectedAsset.status === 'Baik' ? 'green' : 'red'}>
                                            {selectedAsset.status}
                                        </Tag> // Menampilkan status aset dengan tag berwarna
                                    </div>

                                    <div style={styles.viewSection}>
                                        <Text type="secondary" style={styles.viewLabel}>
                                            Tanggal Dibuat
                                        </Text> // Menampilkan tanggal dibuat aset
                                        <Text style={styles.viewValue}>
                                            {new Date(selectedAsset.created_at).toLocaleDateString()}
                                        </Text> // Mengubah tanggal dibuat ke format lokal
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={styles.viewFooter}>
                            <Button onClick={handleViewCancel}>Close</Button>
                        </div>
                    </Modal>

                    <Modal // Modal untuk menampilkan hasil operasi (tambah/edit/hapus)
                        visible={resultModal.visible} // Status modal terlihat
                        onCancel={() => setResultModal(prev => ({ ...prev, visible: false }))} // Fungsi untuk menutup modal
                        footer={[
                            <Button key="ok" type="primary" onClick={() => setResultModal(prev => ({ ...prev, visible: false }))}>
                                OK
                            </Button>, //   Tombol OK untuk menutup modal
                        ]}
                        centered
                    >
                        <div style={{ textAlign: 'center' }}>
                            <Typography.Title level={4} style={{ color: resultModal.success ? 'green' : 'red' }}>
                                {resultModal.success ? 'Berhasil' : 'Gagal'} // Judul modal sesuai dengan status operasi
                            </Typography.Title>
                            <Typography.Text>{resultModal.message}</Typography.Text>//
                        </div>
                    </Modal>


                </Content>
            </Layout>
        </Layout>
    );
}

const styles: { [key: string]: React.CSSProperties } = { // Gaya CSS untuk komponen Manajemen Aset
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
