import api from './client'

export const exportBackup = () =>
  api.get('/backup/export').then((r) => r.data)

export const importBackup = (payload) =>
  api.post('/backup/import', payload).then((r) => r.data)
