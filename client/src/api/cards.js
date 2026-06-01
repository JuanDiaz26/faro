import api from './client'

// Tarjetas
export const getCards = (includeArchived = false) =>
  api
    .get('/cards', { params: includeArchived ? { active: 'false' } : {} })
    .then((r) => r.data)

export const getCard = (id) => api.get(`/cards/${id}`).then((r) => r.data)

export const createCard = (data) => api.post('/cards', data).then((r) => r.data)

export const updateCard = (id, data) =>
  api.put(`/cards/${id}`, data).then((r) => r.data)

export const deleteCard = (id) => api.delete(`/cards/${id}`).then((r) => r.data)

export const closeStatement = (id) =>
  api.post(`/cards/${id}/close-statement`).then((r) => r.data)

// Cargos
export const getCharges = (filters = {}) =>
  api.get('/card-charges', { params: filters }).then((r) => r.data)

export const createCharge = (data) =>
  api.post('/card-charges', data).then((r) => r.data)

export const updateCharge = (id, data) =>
  api.put(`/card-charges/${id}`, data).then((r) => r.data)

export const deleteCharge = (id) =>
  api.delete(`/card-charges/${id}`).then((r) => r.data)
