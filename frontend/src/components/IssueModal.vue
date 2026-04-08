<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ issue?.id ? 'Edit Issue' : 'New Issue' }}</h3>
      <div class="form-group">
        <label>Name *</label>
        <input v-model="form.name" placeholder="Issue name" />
      </div>
      <div class="form-group">
        <label>Type</label>
        <select v-model="form.type">
          <option value="task">Task</option>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
        </select>
      </div>
      <div class="form-group">
        <label>Story Points</label>
        <input v-model.number="form.storyPoints" type="number" min="0" placeholder="e.g. 3" />
      </div>
      <div class="form-group">
        <label>State</label>
        <select v-model="form.stateId">
          <option v-for="s in states" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
      <div class="modal-actions">
        <button v-if="issue?.id" class="btn btn-danger btn-sm" @click="confirmDelete">Delete</button>
        <div style="flex:1"></div>
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary" @click="save" :disabled="!form.name">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  issue: Object,
  states: Array,
  defaultStateId: String
})
const emit = defineEmits(['close', 'save', 'delete'])

const form = ref({ name: '', type: 'task', storyPoints: null, stateId: '' })
const error = ref('')

watch(() => props.issue, (issue) => {
  if (issue) {
    form.value = {
      name: issue.name || '',
      type: issue.type || 'task',
      storyPoints: issue.storyPoints ?? null,
      stateId: issue.stateId || props.defaultStateId || ''
    }
  } else {
    form.value = { name: '', type: 'task', storyPoints: null, stateId: props.defaultStateId || '' }
  }
}, { immediate: true })

function save() {
  if (!form.value.name.trim()) { error.value = 'Name is required'; return }
  emit('save', { ...form.value, storyPoints: form.value.storyPoints || null })
}

function confirmDelete() {
  if (confirm('Delete this issue?')) emit('delete', props.issue.id)
}
</script>
