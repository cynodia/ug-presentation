import { defineStore } from 'pinia'
import axios from 'axios'

export const useProjectStore = defineStore('project', {
  state: () => ({
    projects: [],
    currentProject: null,
    states: [],
    issues: [],
  }),
  actions: {
    async fetchProjects() {
      const { data } = await axios.get('/api/projects', { withCredentials: true })
      this.projects = data
    },
    async fetchProject(id) {
      const { data } = await axios.get(`/api/projects/${id}`, { withCredentials: true })
      this.currentProject = data
      this.states = data.states
    },
    async fetchIssues(projectId) {
      const { data } = await axios.get(`/api/projects/${projectId}/issues`, { withCredentials: true })
      this.issues = data
    },
    async createProject(payload) {
      const { data } = await axios.post('/api/projects', payload, { withCredentials: true })
      this.projects.push(data)
      return data
    },
    async createIssue(projectId, payload) {
      const { data } = await axios.post(`/api/projects/${projectId}/issues`, payload, { withCredentials: true })
      this.issues.push(data)
      return data
    },
    async updateIssue(projectId, issueId, payload) {
      const { data } = await axios.put(`/api/projects/${projectId}/issues/${issueId}`, payload, { withCredentials: true })
      const idx = this.issues.findIndex(i => i.id === issueId)
      if (idx !== -1) this.issues[idx] = data
      return data
    },
    async deleteIssue(projectId, issueId) {
      await axios.delete(`/api/projects/${projectId}/issues/${issueId}`, { withCredentials: true })
      this.issues = this.issues.filter(i => i.id !== issueId)
    },
    async reorderIssues(projectId, updates) {
      await axios.put(`/api/projects/${projectId}/issues/reorder`, updates, { withCredentials: true })
    }
  }
})
