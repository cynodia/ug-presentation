<template>
  <nav class="navbar">
    <div class="navbar-left">
      <span class="navbar-brand">📋 Kanban</span>
      <div class="project-selector" v-if="projectStore.projects.length > 0 || projectStore.currentProject">
        <select class="project-select" :value="currentProjectId" @change="switchProject">
          <option value="">— Select Project —</option>
          <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button class="btn btn-sm btn-secondary" @click="showCreateProject = true">+</button>
      </div>
      <button v-else class="btn btn-sm btn-primary" @click="showCreateProject = true">+ New Project</button>
    </div>

    <div class="navbar-center" v-if="currentProjectId">
      <router-link :to="`/projects/${currentProjectId}/backlog`" class="nav-link">Backlog</router-link>
      <router-link :to="`/projects/${currentProjectId}/kanban`" class="nav-link">Kanban</router-link>
      <router-link :to="`/projects/${currentProjectId}/config`" class="nav-link">Config</router-link>
    </div>

    <div class="navbar-right">
      <span class="username">{{ auth.user?.username }}</span>
      <router-link v-if="auth.user?.isSuperAdmin" to="/admin" class="nav-link">Admin</router-link>
      <button class="btn btn-sm btn-secondary" @click="logout">Logout</button>
    </div>

    <!-- Create Project Modal -->
    <div class="modal-overlay" v-if="showCreateProject" @click.self="showCreateProject = false">
      <div class="modal">
        <h3>Create New Project</h3>
        <div class="form-group">
          <label>Project Name</label>
          <input v-model="newProject.name" placeholder="Project name" />
        </div>
        <div class="form-group">
          <label>Account</label>
          <select v-model="newProject.accountId">
            <option value="">Select account</option>
            <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCreateProject = false">Cancel</button>
          <button class="btn btn-primary" @click="createProject" :disabled="!newProject.name || !newProject.accountId">Create</button>
        </div>
        <p v-if="createError" class="error-text">{{ createError }}</p>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'
import axios from 'axios'

const auth = useAuthStore()
const projectStore = useProjectStore()
const router = useRouter()
const route = useRoute()

const showCreateProject = ref(false)
const newProject = ref({ name: '', accountId: '' })
const accounts = ref([])
const createError = ref('')

const currentProjectId = computed(() => route.params.projectId || '')

onMounted(async () => {
  await projectStore.fetchProjects()
  try {
    const { data } = await axios.get('/api/accounts', { withCredentials: true })
    accounts.value = data
  } catch {}
})

async function switchProject(e) {
  const id = e.target.value
  if (id) router.push(`/projects/${id}/kanban`)
}

async function createProject() {
  createError.value = ''
  try {
    const project = await projectStore.createProject(newProject.value)
    showCreateProject.value = false
    newProject.value = { name: '', accountId: '' }
    router.push(`/projects/${project.id}/kanban`)
  } catch (e) {
    createError.value = e.response?.data?.error || 'Failed to create project'
  }
}

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>
