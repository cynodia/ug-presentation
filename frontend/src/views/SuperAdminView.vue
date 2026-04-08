<template>
  <div class="admin-view">
    <div class="view-header">
      <h2>🛡️ Super Admin Panel</h2>
    </div>
    <div class="tabs">
      <button :class="['tab', { active: tab === 'accounts' }]" @click="tab = 'accounts'">Accounts</button>
      <button :class="['tab', { active: tab === 'users' }]" @click="tab = 'users'">Users</button>
    </div>

    <!-- Accounts Tab -->
    <div v-if="tab === 'accounts'" class="tab-content">
      <div class="section-header">
        <h3>Accounts</h3>
        <button class="btn btn-primary btn-sm" @click="openCreateAccount">+ New Account</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Project Limit</th>
            <th>Projects</th>
            <th>Users</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in accounts" :key="a.id">
            <td>{{ a.name }}</td>
            <td>{{ a.projectLimit ?? '∞' }}</td>
            <td>{{ a._count?.projects ?? 0 }}</td>
            <td>{{ a._count?.users ?? 0 }}</td>
            <td>
              <button class="btn btn-sm btn-secondary" @click="openEditAccount(a)">Edit</button>
              <button class="btn btn-sm btn-danger" @click="deleteAccount(a)">Delete</button>
            </td>
          </tr>
          <tr v-if="!accounts.length">
            <td colspan="5" class="empty-state">No accounts found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Users Tab -->
    <div v-if="tab === 'users'" class="tab-content">
      <div class="section-header">
        <h3>Users</h3>
        <button class="btn btn-primary btn-sm" @click="openCreateUser">+ New User</button>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Super Admin</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ u.username }}</td>
            <td>{{ u.isSuperAdmin ? '✓' : '' }}</td>
            <td>{{ new Date(u.createdAt).toLocaleDateString() }}</td>
            <td>
              <button class="btn btn-sm btn-danger" @click="deleteUser(u)">Delete</button>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="4" class="empty-state">No users found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Account Modal -->
    <div class="modal-overlay" v-if="showAccountModal" @click.self="showAccountModal = false">
      <div class="modal">
        <h3>{{ editingAccount?.id ? 'Edit Account' : 'New Account' }}</h3>
        <div class="form-group">
          <label>Name</label>
          <input v-model="accountForm.name" placeholder="Account name" />
        </div>
        <div class="form-group">
          <label>Project Limit (leave empty for unlimited)</label>
          <input v-model.number="accountForm.projectLimit" type="number" min="0" placeholder="e.g. 10" />
        </div>
        <p v-if="accountError" class="error-text">{{ accountError }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showAccountModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveAccount">Save</button>
        </div>
      </div>
    </div>

    <!-- User Modal -->
    <div class="modal-overlay" v-if="showUserModal" @click.self="showUserModal = false">
      <div class="modal">
        <h3>New User</h3>
        <div class="form-group">
          <label>Username</label>
          <input v-model="userForm.username" placeholder="username" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="userForm.password" type="password" placeholder="password" />
        </div>
        <div class="form-group">
          <label>Account (optional)</label>
          <select v-model="userForm.accountId">
            <option value="">None</option>
            <option v-for="a in accounts" :key="a.id" :value="a.id">{{ a.name }}</option>
          </select>
        </div>
        <p v-if="userError" class="error-text">{{ userError }}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showUserModal = false">Cancel</button>
          <button class="btn btn-primary" @click="saveUser">Create</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const tab = ref('accounts')
const accounts = ref([])
const users = ref([])
const showAccountModal = ref(false)
const showUserModal = ref(false)
const editingAccount = ref(null)
const accountForm = ref({ name: '', projectLimit: '' })
const accountError = ref('')
const userForm = ref({ username: '', password: '', accountId: '' })
const userError = ref('')

async function loadAccounts() {
  const { data } = await axios.get('/api/accounts', { withCredentials: true })
  accounts.value = data
}

async function loadUsers() {
  const { data } = await axios.get('/api/users', { withCredentials: true })
  users.value = data
}

onMounted(() => { loadAccounts(); loadUsers() })

function openCreateAccount() {
  editingAccount.value = null
  accountForm.value = { name: '', projectLimit: '' }
  accountError.value = ''
  showAccountModal.value = true
}

function openEditAccount(a) {
  editingAccount.value = a
  accountForm.value = { name: a.name, projectLimit: a.projectLimit || '' }
  accountError.value = ''
  showAccountModal.value = true
}

async function saveAccount() {
  accountError.value = ''
  try {
    const payload = { name: accountForm.value.name, projectLimit: accountForm.value.projectLimit || null }
    if (editingAccount.value?.id) {
      await axios.put(`/api/accounts/${editingAccount.value.id}`, payload, { withCredentials: true })
    } else {
      await axios.post('/api/accounts', payload, { withCredentials: true })
    }
    showAccountModal.value = false
    await loadAccounts()
  } catch (e) {
    accountError.value = e.response?.data?.error || 'Failed to save'
  }
}

async function deleteAccount(a) {
  if (!confirm(`Delete account "${a.name}"?`)) return
  await axios.delete(`/api/accounts/${a.id}`, { withCredentials: true })
  await loadAccounts()
}

function openCreateUser() {
  userForm.value = { username: '', password: '', accountId: '' }
  userError.value = ''
  showUserModal.value = true
}

async function saveUser() {
  userError.value = ''
  try {
    const { data: user } = await axios.post(
      '/api/users',
      { username: userForm.value.username, password: userForm.value.password },
      { withCredentials: true }
    )
    if (userForm.value.accountId) {
      await axios.post(`/api/accounts/${userForm.value.accountId}/users`, { userId: user.id }, { withCredentials: true })
    }
    showUserModal.value = false
    await loadUsers()
  } catch (e) {
    userError.value = e.response?.data?.error || 'Failed to create user'
  }
}

async function deleteUser(u) {
  if (!confirm(`Delete user "${u.username}"?`)) return
  await axios.delete(`/api/users/${u.id}`, { withCredentials: true })
  await loadUsers()
}
</script>
