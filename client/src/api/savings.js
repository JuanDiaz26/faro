import api from './client'

// Metas
export const getGoals = (includeArchived = false) =>
  api
    .get('/savings/goals', { params: includeArchived ? { active: 'false' } : {} })
    .then((r) => r.data)

export const createGoal = (data) =>
  api.post('/savings/goals', data).then((r) => r.data)

export const updateGoal = (id, data) =>
  api.put(`/savings/goals/${id}`, data).then((r) => r.data)

export const deleteGoal = (id) =>
  api.delete(`/savings/goals/${id}`).then((r) => r.data)

// Movimientos
export const getMovements = (filters = {}) =>
  api.get('/savings/movements', { params: filters }).then((r) => r.data)

export const createMovement = (data) =>
  api.post('/savings/movements', data).then((r) => r.data)

export const updateMovement = (id, data) =>
  api.put(`/savings/movements/${id}`, data).then((r) => r.data)

export const deleteMovement = (id) =>
  api.delete(`/savings/movements/${id}`).then((r) => r.data)

// Summary
export const getSavingsSummary = (month, year) =>
  api
    .get('/savings/summary', { params: { month, year } })
    .then((r) => r.data)
