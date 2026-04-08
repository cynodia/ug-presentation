<template>
  <div class="config-view">
    <div class="view-header">
      <h2>{{ project?.name }} — Configuration</h2>
    </div>

    <div class="tabs">
      <button :class="['tab', { active: tab === 'states' }]" @click="tab = 'states'">States</button>
      <button :class="['tab', { active: tab === 'members' }]" @click="tab = 'members'">Members</button>
      <button :class="['tab', { active: tab === 'general' }]" @click="tab = 'general'">General</button>
    </div>

    <!-- States Tab -->
    <div v-if="tab === 'states'" class="tab-content">
      <div class="section-header">
        <h3>States</h3>
        <button class="btn btn-primary btn-sm" @click="showAddState = true">+ Add State</button>
      </div>
      <div class="states-list">
        <div v-for="state in systemStates" :key="state.id" class="state-row system">
          <span class="color-dot" :style="{ background: state.color }"></span>
          <span class="state-name">{{ state.name }}</span>
          <span class="badge">System</span>
        </div>
        <draggable v-model="customStatesLocal" item-key="id" handle=".drag-handle" @end="reorderStates" :animation="200">
          <template #item="{ element }">
            <div class="state-row">
              <span class="drag-handle">⠿</span>
              <input type="color" :value="element.color" @change="updateStateColor(element, $event.target.value)" class="color-input" />
              <input
                v-if="editingStateId === element.id"
                v-model="editingStateName"
                @blur="saveStateName(element)"
                @keyup.enter="saveStateName(element)"
                class="state-name-input"
              />
              <span v-else class="state-name" @dblclick="startEdit(element)">{{ element.name }}</span>
              <button class="btn btn-danger btn-sm" @click="deleteState(element)">Delete</button>
            </div>
          </template>
        </draggable>
      </div>

      <!-- Add State Modal -->
      <div class="modal-overlay" v-if="showAddState" @click.self="showAddState = false">
        <div class="modal">
          <h3>Add State</h3>
          <div class="form-group">
            <label>Name</label>
            <input v-model="newState.name" placeholder="State name" />
          </div>
          <div class="form-group">
            <label>Color</label>
            <input type="color" v-model="newState.color" />
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="showAddState = false">Cancel</button>
            <button class="btn btn-primary" @click="addState">Add</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Members Tab -->
    <div v-if="tab === 'members'" class="tab-content">
      <div class="section-header">
        <h3>Members</h3>
      </div>
      <div class="members-list">
        <div v-for="pu in project?.users" :key="pu.userId" class="member-row">
          <span>{{ pu.user?.username }}</span>
          <button class="btn btn-danger btn-sm" @click="removeMember(pu.userId)">Remove</button>
        </div>
        <p v-if="!project?.users?.length" class="empty-state">No members yet</p>
      </div>
      <div class="add-member">
        <h4>Add Member</h4>
        <div class="form-row">
          <select v-model="newMemberUserId">
            <option value="">Select user</option>
            <option v-for="u in availableUsers" :key="u.id" :value="u.id">{{ u.username }}</option>
          </select>
          <button class="btn btn-primary btn-sm" @click="addMember" :disabled="!newMemberUserId">Add</button>
        </div>
      </div>
    </div>

    <!-- General Tab -->
    <div v-if="tab === 'general'" class="tab-content">
      <div class="form-group">
        <label>Project Name</label>
        <input v-model="editName" />
      </div>
      <button class="btn btn-primary" @click="saveName">Save</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import axios from 'axios'

const route = useRoute()
const tab = ref('states')
const project = ref(null)
const showAddState = ref(false)
const newState = ref({ name: '', color: '#6366f1' })
const editingStateId = ref(null)
const editingStateName = ref('')
const newMemberUserId = ref('')
const accountUsers = ref([])
const editName = ref('')
const customStatesLocal = ref([])

const systemStates = computed(() =>
  (project.value?.states || []).filter(s => s.isSystem).sort((a, b) => a.order - b.order)
)

const availableUsers = computed(() => {
  const memberIds = (project.value?.users || []).map(u => u.userId)
  return accountUsers.value.filter(u => !memberIds.includes(u.id))
})

async function load() {
  const { data } = await axios.get(`/api/projects/${route.params.projectId}`, { withCredentials: true })
  project.value = data
  editName.value = data.name
  customStatesLocal.value = (data.states || []).filter(s => !s.isSystem).sort((a, b) => a.order - b.order)
  if (data.accountId) {
    try {
      const { data: accData } = await axios.get(`/api/accounts/${data.accountId}`, { withCredentials: true })
      accountUsers.value = (accData.users || []).map(au => au.user)
    } catch {}
  }
}

onMounted(load)
watch(() => route.params.projectId, load)

function startEdit(state) {
  editingStateId.value = state.id
  editingStateName.value = state.name
}

async function saveStateName(state) {
  if (editingStateName.value.trim()) {
    await axios.put(
      `/api/projects/${route.params.projectId}/states/${state.id}`,
      { name: editingStateName.value, color: state.color, order: state.order },
      { withCredentials: true }
    )
  }
  editingStateId.value = null
  await load()
}

async function updateStateColor(state, color) {
  await axios.put(
    `/api/projects/${route.params.projectId}/states/${state.id}`,
    { name: state.name, color, order: state.order },
    { withCredentials: true }
  )
  await load()
}

async function deleteState(state) {
  if (!confirm(`Delete state "${state.name}"?`)) return
  await axios.delete(`/api/projects/${route.params.projectId}/states/${state.id}`, { withCredentials: true })
  await load()
}

async function reorderStates() {
  const updates = customStatesLocal.value.map((s, i) => ({ id: s.id, order: i + 1 }))
  await axios.put(`/api/projects/${route.params.projectId}/states/reorder`, updates, { withCredentials: true })
  await load()
}

async function addState() {
  const maxOrder = customStatesLocal.value.reduce((m, s) => Math.max(m, s.order), 0)
  await axios.post(
    `/api/projects/${route.params.projectId}/states`,
    { ...newState.value, order: maxOrder + 1 },
    { withCredentials: true }
  )
  showAddState.value = false
  newState.value = { name: '', color: '#6366f1' }
  await load()
}

async function removeMember(userId) {
  if (!confirm('Remove this member?')) return
  await axios.delete(`/api/projects/${route.params.projectId}/users/${userId}`, { withCredentials: true })
  await load()
}

async function addMember() {
  await axios.post(
    `/api/projects/${route.params.projectId}/users`,
    { userId: newMemberUserId.value },
    { withCredentials: true }
  )
  newMemberUserId.value = ''
  await load()
}

async function saveName() {
  await axios.put(`/api/projects/${route.params.projectId}`, { name: editName.value }, { withCredentials: true })
  await load()
}
</script>
