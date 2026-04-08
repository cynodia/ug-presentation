<template>
  <div id="app-root">
    <TopNavBar v-if="auth.user" />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import TopNavBar from './components/TopNavBar.vue'

const auth = useAuthStore()
onMounted(() => auth.fetchMe())
</script>
