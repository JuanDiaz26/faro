import api from './client'

export const getLifeGoals = () => api.get('/life-goals').then((r) => r.data)

export const createLifeGoal = (data) =>
  api.post('/life-goals', data).then((r) => r.data)

export const updateLifeGoal = (id, data) =>
  api.put(`/life-goals/${id}`, data).then((r) => r.data)

export const deleteLifeGoal = (id) =>
  api.delete(`/life-goals/${id}`).then((r) => r.data)
