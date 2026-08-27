import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const companyApi = {
  getAll: () => api.get('/companies').then(res => res.data),
  getById: (id) => api.get(`/companies/${id}`).then(res => res.data),
  create: (data) => api.post('/companies', data).then(res => res.data),
  update: (id, data) => api.put(`/companies/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/companies/${id}`).then(res => res.data),
};

export const deviceApi = {
  getAll: (companyId) => api.get('/devices', { params: { companyId } }).then(res => res.data),
  register: (data) => api.post('/devices', data).then(res => res.data),
  update: (id, data) => api.put(`/devices/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/devices/${id}`).then(res => res.data),
};

export const employeeApi = {
  getAll: (companyId) => api.get('/employees', { params: { companyId } }).then(res => res.data),
  create: (data) => api.post('/employees', data).then(res => res.data),
  update: (id, data) => api.put(`/employees/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/employees/${id}`).then(res => res.data),
};

export const attendanceApi = {
  getLogs: (params) => api.get('/attendance/logs', { params }).then(res => res.data),
  getStats: (companyId) => api.get('/attendance/stats', { params: { companyId } }).then(res => res.data),
  simulatePush: (data) => api.post('/adms/simulate', data).then(res => res.data),
};

export default api;
