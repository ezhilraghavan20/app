import axios from 'axios'

const TOKEN_KEY = 'nexus_token'

export const getToken  = ()       => localStorage.getItem(TOKEN_KEY)
export const setToken  = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = ()      => localStorage.removeItem(TOKEN_KEY)

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000' })

api.interceptors.request.use(cfg => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) { clearToken(); window.location.href = '/login' }
  return Promise.reject(err)
})

export default api
