import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'https://api.escuelajs.co/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const backendApiClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL ?? 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})