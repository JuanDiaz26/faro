import api from './client'

export const getFixedExpenses = (includeArchived = false) =>
  api
    .get('/fixed-expenses', { params: includeArchived ? { active: 'false' } : {} })
    .then((r) => r.data)

export const createFixedExpense = (data) =>
  api.post('/fixed-expenses', data).then((r) => r.data)

export const updateFixedExpense = (id, data) =>
  api.put(`/fixed-expenses/${id}`, data).then((r) => r.data)

export const deleteFixedExpense = (id) =>
  api.delete(`/fixed-expenses/${id}`).then((r) => r.data)
