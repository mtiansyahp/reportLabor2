import axios from 'axios';

// dipakai untuk semua request yang butuh token
export const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    withCredentials: true, // ⬅️ wajib untuk CSRF & cookie session
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers!['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

// instance khusus auth (login/register) tanpa interceptor
export const authApi = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    withCredentials: true, // ⬅️ juga tambahkan di sini
});