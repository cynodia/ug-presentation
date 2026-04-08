<template>
  <div class="backlog-view">
    <div class="view-header">
      <h2>{{ projectStore.currentProject?.name }} — Backlog</h2>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" @click="showClosed = !showClosed">
          {{ showClosed ? 'Hide Closed' : 'Show Closed' }}
        </button>
        <button class="btn btn-primary" @click="openCreate">+ Add Issue</button>
      </div>
    </div>

    <div v-if="!loading">
      <div class="backlog-section">
        <h3 class="section-title">
          <span class="state-dot" :style="{ background: backlogState?.color }"></span>
          Backlog ({{ backlogIssues.length }})
        </h3>
        <draggable
          v-model="backlogIssues"
          item-key="id"
          class="issue-list-vertical"
          @end="onReorder"
          :animation="200"
        >
          <template #item="{ element }">
            <div class="issue-row" @click="openEdit(element)">
              <div class="issue-row-left">
                <span class="drag-handle">⠿</span>
                <span :class="['badge', `badge-${element.type}`]">{{ element.type }}</span>
                <span class="issue-name">{{ element.name }}</span>
              </div>
              <div class="issue-row-right">
                <span v-if="element.storyPoints" class="story-points">{{ element.storyPoints }}pt</span>
              </div>
            </div>
          </template>
        </draggable>
        <p v-if="backlogIssues.length === 0" class="empty-state">No issues in backlog</p>
      </div>

      <div v-if="showClosed" class="backlog-section closed-section">
        <h3 class="section-title">
          <span class="state-dot" :style="{ background: closedState?.color }"></span>
          Closed ({{ closedIssues.length }})
        </h3>
        <div class="issue-list-vertical">
          <div v-for="issue in closedIssues" :key="issue.id" class="issue-row closed" @click="openEdit(issue)">
            <div class="issue-row-left">
              <span :class="['badge', `badge-${issue.type}`]">{{ issue.type }}</span>
              <span class="issue-name">{{ issue.name }}</span>
            </div>
            <div class="issue-row-right">
              <span v-if="issue.storyPoints" class="story-points">{{ issue.storyPoints }}pt</span>
            </div>
          </div>
        </div>
        <p v-if="closedIssues.length === 0" class="empty-state">No closed issues</p>
      </div>
    </div>
    <div v-else class="loading">Loading...</div>

    <IssueModal
      v-if="showModal"
      :issue="selectedIssue"
      :states="projectStore.states"
      :defaultStateId="backlogState?.id"
      @close="showModal = false"
      @save="saveIssue"
      @delete="deleteIssue"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '../stores/project'
import draggable from 'vuedraggable'
import IssueModal from '../components/IssueModal.vue'

const route = useRoute()
const projectStore = useProjectStore()
const loading = ref(true)
const showClosed = ref(false)
const showModal = ref(false)
const selectedIssue = ref(null)

const backlogState = computed(() => projectStore.states.find(s => s.name === 'Backlog'))
const closedState = computed(() => projectStore.states.find(s => s.name === 'Closed'))
const closedIssues = computed(() =>
  projectStore.issues.filter(i => i.stateId === closedState.value?.id).sort((a, b) => a.order - b.order)
)

const backlogIssues = computed({
  get() {
    return projectStore.issues
      .filter(i => i.stateId === backlogState.value?.id)
      .sort((a, b) => a.order - b.order)
  },
  set() {
    // handled by onReorder
  }
})

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

function openCreate() {
  selectedIssue.value = null
  showModal.value = true
}

function openEdit(issue) {
  selectedIssue.value = issue
  showModal.value = true
}

async function saveIssue(data) {
  try {
    if (selectedIssue.value?.id) {
      await projectStore.updateIssue(route.params.projectId, selectedIssue.value.id, data)
    } else {
      const max = backlogIssues.value.reduce((m, i) => Math.max(m, i.order), 0)
      await projectStore.createIssue(route.params.projectId, {
        ...data,
        stateId: data.stateId || backlogState.value?.id,
        order: max + 1
      })
    }
    showModal.value = false
  } catch (e) {
    alert(e.response?.data?.error || 'Failed to save')
  }
}

async function deleteIssue(id) {
  await projectStore.deleteIssue(route.params.projectId, id)
  showModal.value = false
}

async function onReorder() {
  const issues = backlogIssues.value
  const updates = issues.map((issue, index) => ({ id: issue.id, order: index, stateId: backlogState.value.id }))
  projectStore.issues = projectStore.issues.map(i => {
    const u = updates.find(u => u.id === i.id)
    return u ? { ...i, order: u.order } : i
  })
  await projectStore.reorderIssues(route.params.projectId, updates)
}
</script>
