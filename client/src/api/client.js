// Instancia Axios para hablar con el backend.
// Usa el proxy de Vite: en dev /api → http://localhost:3000/api
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
})

export default api
