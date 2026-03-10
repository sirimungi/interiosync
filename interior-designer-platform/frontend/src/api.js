import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token to every request (e.g. after refresh)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const register = async (name, email, password, role) => {
  const res = await api.post('/auth/register', { name, email, password, role });
  return res.data;
};

/** Alias for register – use /auth/signup endpoint */
export const signup = async (name, email, password, role) => {
  const res = await api.post('/auth/signup', { name, email, password, role });
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const fetchProjects = async () => {
  const res = await api.get('/projects');
  return res.data;
};

export const fetchProject = async (id) => {
  const res = await api.get(`/projects/${id}`);
  return res.data;
};

export const createProject = async (data) => {
  const res = await api.post('/projects', data);
  return res.data;
};

export const updateProject = async (id, data) => {
  const res = await api.patch(`/projects/${id}`, data);
  return res.data;
};

export const fetchTasks = async (projectId) => {
  const res = await api.get('/tasks', { params: { project_id: projectId } });
  return res.data;
};

export const createTask = async (data) => {
  const res = await api.post('/tasks', data);
  return res.data;
};

export const updateTask = async (id, data) => {
  const res = await api.patch(`/tasks/${id}`, data);
  return res.data;
};

export const deleteTask = async (id) => {
  await api.delete(`/tasks/${id}`);
};

export const fetchFiles = async (projectId) => {
  const res = await api.get('/files', { params: { project_id: projectId } });
  return res.data;
};

export const uploadFile = async (projectId, file) => {
  const formData = new FormData();
  formData.append('project_id', projectId);
  formData.append('file', file);
  const res = await api.post('/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const fetchMessages = async (projectId) => {
  const res = await api.get('/messages', { params: { project_id: projectId } });
  return res.data;
};

export const sendMessage = async (projectId, content) => {
  const res = await api.post('/messages', { project_id: projectId, content });
  return res.data;
};

export const getUsersByRole = async (role) => {
  const res = await api.get('/users', { params: { role } });
  return res.data;
};
