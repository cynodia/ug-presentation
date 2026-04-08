<template>
  <div class="kanban-view">
    <div class="view-header">
      <h2>{{ projectStore.currentProject?.name }} — Kanban Board</h2>
    </div>

    <div class="kanban-board" v-if="!loading">
      <StateColumn
        v-for="state in kanbanStates"
        :key="state.id"
        :state="state"
        :issues="issuesByState(state.id)"
        @add-issue="openCreateIssue"
        @edit-issue="openEditIssue"
        @close-issue="promptCloseIssue"
        @reorder="handleReorder"
      />
    </div>
    <div v-else class="loading">Loading...</div>

    <IssueModal
      v-if="showIssueModal"
      :issue="selectedIssue"
      :states="projectStore.states"
      :defaultStateId="modalDefaultStateId"
      @close="showIssueModal = false"
      @save="saveIssue"
      @delete="deleteIssue"
    />

    <!-- Close Issue Confirmation -->
    <div class="modal-overlay" v-if="showCloseModal" @click.self="showCloseModal = false">
      <div class="modal">
        <h3>Close Issue</h3>
        <p>Move "<strong>{{ closingIssue?.name }}</strong>" to the Closed state?</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showCloseModal = false">Cancel</button>
          <button class="btn btn-danger" @click="closeIssue">Close Issue</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '../stores/project'
import StateColumn from '../components/StateColumn.vue'
import IssueModal from '../components/IssueModal.vue'

const route = useRoute()
const projectStore = useProjectStore()
const loading = ref(true)
const showIssueModal = ref(false)
const selectedIssue = ref(null)
const modalDefaultStateId = ref('')
const showCloseModal = ref(false)
const closingIssue = ref(null)

const kanbanStates = computed(() =>
  projectStore.states.filter(s => !s.isSystem).sort((a, b) => a.order - b.order)
)
const closedState = computed(() => projectStore.states.find(s => s.name === 'Closed'))

function issuesByState(stateId) {
  return projectStore.issues.filter(i => i.stateId === stateId).sort((a, b) => a.order - b.order)
}

async function load() {
  loading.value = true
  try {
    await projectStore.fetchProject(route.params.projectId)
    await projectStore.fetchIssues(route.params.projectId)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.projectId, load)

function openCreateIssue(stateId) {
  selectedIssue.value = null
  modalDefaultStateId.value = stateId
  showIssueModal.value = true
}

function openEditIssue(issue) {
  selectedIssue.value = issue
  showIssueModal.value = true
}

async function saveIssue(data) {
  try {
    if (selectedIssue.value?.id) {
      await projectStore.updateIssue(route.params.projectId, selectedIssue.value.id, data)
    } else {
      const maxOrder = issuesByState(data.stateId).reduce((m, i) => Math.max(m, i.order), 0)
      await projectStore.createIssue(route.params.projectId, { ...data, order: maxOrder + 1 })
    }
    showIssueModal.value = false
  } catch (e) {
    alert(e.response?.data?.error || 'Failed to save')
  }
}

async function deleteIssue(id) {
  await projectStore.deleteIssue(route.params.projectId, id)
  showIssueModal.value = false
}

function promptCloseIssue(issue) {
  closingIssue.value = issue
  showCloseModal.value = true
}

async function closeIssue() {
  if (!closedState.value || !closingIssue.value) return
  await projectStore.updateIssue(route.params.projectId, closingIssue.value.id, { stateId: closedState.value.id })
  showCloseModal.value = false
  closingIssue.value = null
}

async function handleReorder({ stateId, issues }) {
  // Update local store immediately for responsive UI
  issues.forEach(({ id, stateId: sid, order }) => {
    const idx = projectStore.issues.findIndex(i => i.id === id)
    if (idx !== -1) {
      projectStore.issues[idx] = { ...projectStore.issues[idx], stateId: sid, order }
    }
  })
  await projectStore.reorderIssues(route.params.projectId, issues)
}
</script>
