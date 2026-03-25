import axios from 'axios'

// VDS'de admin.stark.net.tr → /api/* backend'e proxy edilir
// Localhost'ta direkt 5000'e gider
export const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : ''

export const api = (token: string) => axios.create({
  baseURL: API_URL,
  headers: { Authorization: `Bearer ${token}` }
})
