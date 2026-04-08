import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null }),
  actions: {
    async login(username, password) {
      const { data } = await axios.post('/api/auth/login', { username, password }, { withCredentials: true })
      this.user = data
      return data
    },
    async logout() {
      await axios.post('/api/auth/logout', {}, { withCredentials: true })
      this.user = null
    },
    async fetchMe() {
      try {
        const { data } = await axios.get('/api/auth/me', { withCredentials: true })
        this.user = data
      } catch {
        this.user = null
      }
    }
  }
})
