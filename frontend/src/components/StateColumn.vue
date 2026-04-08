<template>
  <div class="state-column">
    <div class="column-header" :style="{ borderTopColor: state.color }">
      <div class="column-title">
        <span class="state-dot" :style="{ background: state.color }"></span>
        <span>{{ state.name }}</span>
        <span class="issue-count">{{ issues.length }}</span>
      </div>
      <button class="btn btn-sm" @click="$emit('add-issue', state.id)">+</button>
    </div>
    <draggable
      v-model="localIssues"
      group="issues"
      item-key="id"
      class="issue-list"
      @end="onDragEnd"
      :animation="200"
    >
      <template #item="{ element }">
        <div class="issue-card" @click="$emit('edit-issue', element)">
          <div class="issue-card-header">
            <span :class="['badge', `badge-${element.type}`]">{{ element.type }}</span>
            <span v-if="element.storyPoints" class="story-points">{{ element.storyPoints }}pt</span>
          </div>
          <p class="issue-name">{{ element.name }}</p>
          <div class="issue-card-footer">
            <button class="btn btn-sm btn-danger" @click.stop="$emit('close-issue', element)">✕ Close</button>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({ state: Object, issues: Array })
const emit = defineEmits(['add-issue', 'edit-issue', 'close-issue', 'reorder'])

const localIssues = ref([...props.issues])
watch(() => props.issues, (val) => { localIssues.value = [...val] }, { deep: true })

function onDragEnd() {
  emit('reorder', {
    stateId: props.state.id,
    issues: localIssues.value.map((issue, index) => ({
      id: issue.id,
      stateId: props.state.id,
      order: index
    }))
  })
}
</script>
