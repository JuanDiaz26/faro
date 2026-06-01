import api from './client'

export const getDebts = (includeArchived = false) =>
  api
    .get('/debts', { params: includeArchived ? { active: 'false' } : {} })
    .then((r) => r.data)

export const getDebt = (id) => api.get(`/debts/${id}`).then((r) => r.data)

export const createDebt = (data) => api.post('/debts', data).then((r) => r.data)

export const updateDebt = (id, data) =>
  api.put(`/debts/${id}`, data).then((r) => r.data)

export const deleteDebt = (id) => api.delete(`/debts/${id}`).then((r) => r.data)
