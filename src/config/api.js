import axios from 'axios'
import { supabase } from '../services/supabase.js'

const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
const projectUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SUPABASE_URL

export const apiClient = axios.create({
  baseURL: projectUrl ? `${projectUrl.replace(/\/$/, '')}/rest/v1` : '',
  timeout: 10000,
  headers: apiKey ? { apikey: apiKey } : {},
})

apiClient.interceptors.request.use(async (config) => {
  if (!supabase || !apiKey || !projectUrl) {
    throw new Error('Supabase belum dikonfigurasi. Periksa environment variables aplikasi.')
  }
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error('Silakan masuk untuk mengakses catatan.')
  config.headers.Authorization = `Bearer ${data.session.access_token}`
  return config
})
