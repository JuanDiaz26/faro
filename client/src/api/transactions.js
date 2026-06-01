import api from './client'

export const getTransactions = (filters = {}) =>
  api.get('/transactions', { params: filters }).then((r) => r.data)

export const getMonthlySummary = (month, year) =>
  api.get('/transactions/summary', { params: { month, year } }).then((r) => r.data)

export const getTotalBalance = () =>
  api.get('/transactions/balance').then((r) => r.data)

export const getTransaction = (id) =>
  api.get(`/transactions/${id}`).then((r) => r.data)

export const createTransaction = (data) =>
  api.post('/transactions', data).then((r) => r.data)

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data).then((r) => r.data)

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`).then((r) => r.data)
