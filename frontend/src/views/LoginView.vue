<template>
  <div class="login-page">
    <div class="login-card">
      <h1>📋 Kanban Board</h1>
      <p class="subtitle">Sign in to your account</p>
      <form @submit.prevent="login">
        <div class="form-group">
          <label>Username</label>
          <input v-model="form.username" placeholder="Username" autofocus />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" placeholder="Password" />
        </div>
        <p v-if="error" class="error-text">{{ error }}</p>
        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
      <div v-if="isDev" class="demo-creds">
        <p><strong>Demo credentials:</strong></p>
        <p>superadmin / superadmin123</p>
        <p>admin / admin123 | alice / alice123 | bob / bob123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'

const router = useRouter()
const auth = useAuthStore()
const projectStore = useProjectStore()

const isDev = import.meta.env.DEV

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value.username, form.value.password)
    await projectStore.fetchProjects()
    if (projectStore.projects.length > 0) {
      router.push(`/projects/${projectStore.projects[0].id}/kanban`)
    } else {
      router.push('/admin')
    }
  } catch (e) {
    error.value = e.response?.data?.error || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
