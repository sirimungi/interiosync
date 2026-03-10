import axios from 'axios'

// In dev: VITE_API_URL is not set → falls back to localhost.
// In production (FastAPI serves the build): VITE_API_URL is '' → relative URLs so everything
// goes through the same origin, no CORS issues.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// Auth
export const register = (name, email, password, role) =>
  api.post('/auth/register', { name, email, password, role }).then((r) => r.data)

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data)

export const fetchMe = () => api.get('/auth/me').then((r) => r.data)

// Users
export const getUsersByRole = (role) =>
  api.get('/users', { params: { role } }).then((r) => r.data)

// Projects
export const fetchProjects = () => api.get('/projects').then((r) => r.data)
export const fetchProject = (id) => api.get(`/projects/${id}`).then((r) => r.data)
export const createProject = (data) => api.post('/projects', data).then((r) => r.data)
export const updateProject = (id, data) => api.patch(`/projects/${id}`, data).then((r) => r.data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

// Tasks
export const fetchTasks = (projectId) =>
  api.get('/tasks', { params: { project_id: projectId } }).then((r) => r.data)
export const createTask = (data) => api.post('/tasks', data).then((r) => r.data)
export const updateTask = (id, data) => api.patch(`/tasks/${id}`, data).then((r) => r.data)
export const deleteTask = (id) => api.delete(`/tasks/${id}`)

// Files
export const fetchFiles = (projectId) =>
  api.get('/files', { params: { project_id: projectId } }).then((r) => r.data)
export const uploadFile = (projectId, file) => {
  const formData = new FormData()
  formData.append('project_id', projectId)
  formData.append('file', file)
  return api.post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data)
}
export const deleteFile = (id) => api.delete(`/files/${id}`)

// Messages
export const fetchMessages = (projectId) =>
  api.get('/messages', { params: { project_id: projectId } }).then((r) => r.data)
export const sendMessage = (projectId, content) =>
  api.post('/messages', { project_id: projectId, content }).then((r) => r.data)

// Quotes
export const fetchQuotes = (params) => api.get('/quotes', { params }).then((r) => r.data)
export const fetchQuote = (id) => api.get(`/quotes/${id}`).then((r) => r.data)
export const createQuote = (data) => api.post('/quotes', data).then((r) => r.data)
export const updateQuote = (id, data) => api.patch(`/quotes/${id}`, data).then((r) => r.data)
export const sendQuote = (id) => api.post(`/quotes/${id}/send`).then((r) => r.data)
export const respondToQuote = (id, data) => api.post(`/quotes/${id}/respond`, data).then((r) => r.data)
export const deleteQuote = (id) => api.delete(`/quotes/${id}`)

export const addQuoteItem = (quoteId, data) =>
  api.post(`/quotes/${quoteId}/items`, data).then((r) => r.data)
export const updateQuoteItem = (quoteId, itemId, data) =>
  api.patch(`/quotes/${quoteId}/items/${itemId}`, data).then((r) => r.data)
export const deleteQuoteItem = (quoteId, itemId) =>
  api.delete(`/quotes/${quoteId}/items/${itemId}`)

// Appointments
export const fetchAppointments = (params) =>
  api.get('/appointments', { params }).then((r) => r.data)
export const fetchAppointment = (id) => api.get(`/appointments/${id}`).then((r) => r.data)
export const createAppointment = (data) => api.post('/appointments', data).then((r) => r.data)
export const updateAppointment = (id, data) =>
  api.patch(`/appointments/${id}`, data).then((r) => r.data)
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`)

// Leads
export const submitInquiry = (data) => api.post('/leads', data).then((r) => r.data)
export const addManualLead = (data) => api.post('/leads/manual', data).then((r) => r.data)
export const fetchLeads = (params) => api.get('/leads', { params }).then((r) => r.data)
export const fetchLead = (id) => api.get(`/leads/${id}`).then((r) => r.data)
export const updateLead = (id, data) => api.patch(`/leads/${id}`, data).then((r) => r.data)
export const convertLead = (id, data) => api.post(`/leads/${id}/convert`, data).then((r) => r.data)

export default api
export { API_URL }
