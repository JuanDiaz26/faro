import api from './client'

export const getTasks = () => api.get('/tasks').then((r) => r.data)

export const getAgenda = (date) =>
  api.get('/tasks/agenda', { params: date ? { date } : {} }).then((r) => r.data)

export const createTask = (data) => api.post('/tasks', data).then((r) => r.data)

export const updateTask = (id, data) =>
  api.put(`/tasks/${id}`, data).then((r) => r.data)

export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data)

export const toggleTask = (id, date) =>
  api.post(`/tasks/${id}/toggle`, { date }).then((r) => r.data)
