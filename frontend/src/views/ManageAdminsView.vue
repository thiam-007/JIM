<template>
  <div class="manage-admins-shell">
    <!-- Header -->
    <div class="manage-admins-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="users" :size="24" /></div>
        <div class="fh-title">Gestion des Administrateurs</div>
        <div class="fh-sub">Gérez les comptes d'accès de l'équipe du Musée Virtuel de Guinée.</div>
      </div>
      <div class="header-actions fb">
        <div class="search-row">
          <div class="search-wrap">
            <AppIcon name="search" :size="16" class="search-icon" />
            <input
              type="text"
              v-model="search"
              placeholder="Rechercher un administrateur…"
              class="search-input"
            />
          </div>
          <button class="btn-create" @click="openCreate">
            <AppIcon name="user-plus" :size="16" /> Ajouter un administrateur
          </button>
        </div>
      </div>
    </div>

    <!-- Error/No access states -->
    <div v-if="!api.isSuperAdmin" class="admins-empty text-red" v-reveal="0">
      <div class="admins-empty-icon text-red"><AppIcon name="alert-triangle" :size="40" /></div>
      <h3>Accès non autorisé</h3>
      <p>Seul le Super Administrateur peut gérer les comptes d'accès de l'équipe.</p>
    </div>

    <template v-else>
      <!-- Loading -->
      <div v-if="loading" class="admins-loading">
        <AppIcon name="loader" :size="32" class="spin" />
        <span>Chargement des administrateurs…</span>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredUsers.length === 0" class="admins-empty">
        <div class="admins-empty-icon"><AppIcon name="users" :size="40" /></div>
        <p v-if="search">Aucun utilisateur ne correspond à "<strong>{{ search }}</strong>"</p>
        <p v-else>Aucun autre administrateur pour le moment.</p>
      </div>

      <!-- Table / List -->
      <div v-else class="admins-list form-card" v-reveal="100">
        <div class="schedule-table">
          <table>
            <thead>
              <tr>
                <th>Administrateur</th>
                <th>Rôle</th>
                <th>Créé le</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id">
                <td class="user-email-col">
                  <div class="user-email-wrap">
                    <span class="user-avatar">{{ (user.prenom ? user.prenom.charAt(0) : user.email.charAt(0)).toUpperCase() }}</span>
                    <div style="display: flex; flex-direction: column;">
                      <span style="font-weight: 600;">
                        {{ user.prenom || user.nom ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Sans nom' }}
                        <strong v-if="user.email === api.userEmail" class="self-badge">(Vous)</strong>
                      </span>
                      <span style="font-size: 0.85rem; color: #666;">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="role-badge" :class="user.role">
                    <AppIcon :name="user.role === 'super_admin' ? 'shield' : 'user'" :size="14" />
                    {{ user.role === 'super_admin' ? 'Super Admin' : 'Admin' }}
                  </span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td style="text-align: right;">
                  <button 
                    class="btn-delete-user"
                    :disabled="user.email === api.userEmail"
                    @click="confirmDelete(user)"
                    title="Supprimer le compte"
                  >
                    <AppIcon name="trash" :size="15" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Create Admin Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="user-plus" :size="22" /></div>
            <div class="fh-title">Nouvel Administrateur</div>
          </div>
          <div class="fb">
            <form @submit.prevent="saveUser" class="ev-form">
              <div class="fr">
                <div class="fg">
                  <label>Prénom <span class="req">*</span></label>
                  <input type="text" v-model="form.prenom" required placeholder="Ex : John" />
                </div>
                <div class="fg">
                  <label>Nom <span class="req">*</span></label>
                  <input type="text" v-model="form.nom" required placeholder="Ex : Doe" />
                </div>
              </div>

              <div class="fg">
                <label>Adresse E-mail <span class="req">*</span></label>
                <input type="email" v-model="form.email" required placeholder="Ex : dialecte@mvg-events.com" />
              </div>

              <div class="fg">
                <label>Mot de passe (Min. 6 caractères) <span class="req">*</span></label>
                <input type="password" v-model="form.password" required placeholder="Saisissez un mot de passe sécurisé…" />
              </div>

              <div class="fg">
                <label>Rôle <span class="req">*</span></label>
                <select v-model="form.role">
                  <option value="admin">Administrateur standard</option>
                  <option value="super_admin">Super Administrateur (gestion des comptes)</option>
                </select>
              </div>

              <div v-if="formError" class="ev-form-error">
                <AppIcon name="alert-triangle" :size="15" /> {{ formError }}
              </div>

              <div class="ev-form-actions">
                <button type="button" class="btn-cancel" @click="closeModal">Annuler</button>
                <button type="submit" class="bsub bsub-a" :disabled="saving">
                  <AppIcon :name="saving ? 'loader' : 'check'" :size="16" />
                  {{ saving ? 'Enregistrement…' : 'Créer le compte' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal-box modal-confirm form-card">
          <div class="fh fh-s">
            <div class="fh-icon"><AppIcon name="trash" :size="22" /></div>
            <div class="fh-title">Supprimer l'administrateur</div>
          </div>
          <div class="fb">
            <p class="confirm-text">
              Êtes-vous sûr de vouloir supprimer le compte de <strong>{{ deletingUser?.email }}</strong> ?
              Cette personne ne pourra plus se connecter pour administrer l'application.
            </p>
            <div class="ev-form-actions">
              <button class="btn-cancel" @click="showDeleteModal = false">Annuler</button>
              <button class="bsub bsub-s" @click="doDelete" :disabled="deleting">
                <AppIcon :name="deleting ? 'loader' : 'trash'" :size="16" />
                {{ deleting ? 'Suppression…' : 'Supprimer définitivement' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const api = useApiStore()

const users = ref([])
const search = ref('')
const loading = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const deletingUser = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')

const form = ref({
  prenom: '',
  nom: '',
  email: '',
  password: '',
  role: 'admin'
})

onMounted(async () => {
  if (api.isSuperAdmin) {
    await loadUsers()
  }
})

async function loadUsers() {
  loading.value = true
  try {
    users.value = await api.get('/api/auth/users')
  } catch (err) {
    console.error('Erreur chargement administrateurs:', err)
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!search.value.trim()) return users.value
  const q = search.value.toLowerCase().trim()
  return users.value.filter(u =>
    (u.email || '').toLowerCase().includes(q) ||
    (u.prenom || '').toLowerCase().includes(q) ||
    (u.nom || '').toLowerCase().includes(q)
  )
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function openCreate() {
  form.value = { prenom: '', nom: '', email: '', password: '', role: 'admin' }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveUser() {
  formError.value = ''
  if (!form.value.email.trim()) { formError.value = 'L\'adresse email est requise.'; return }
  if (!form.value.password.trim()) { formError.value = 'Le mot de passe est requis.'; return }
  if (form.value.password.length < 6) { formError.value = 'Le mot de passe doit faire au moins 6 caractères.'; return }

  saving.value = true
  try {
    const created = await api.post('/api/auth/users', {
      prenom: form.value.prenom.trim(),
      nom: form.value.nom.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      role: form.value.role
    })
    users.value.push(created)
    users.value.sort((a, b) => a.email.localeCompare(b.email))
    closeModal()
  } catch (err) {
    formError.value = err.message || 'Erreur lors de la création du compte.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(user) {
  if (user.email === api.userEmail) return // Can't delete self
  deletingUser.value = user
  showDeleteModal.value = true
}

async function doDelete() {
  if (!deletingUser.value) return
  deleting.value = true
  try {
    await api.del(`/api/auth/users/${deletingUser.value.id}`)
    users.value = users.value.filter(u => u.id !== deletingUser.value.id)
    showDeleteModal.value = false
    deletingUser.value = null
  } catch (err) {
    formError.value = err.message
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.manage-admins-shell { display: flex; flex-direction: column; gap: 24px; }

/* Header actions */
.search-row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.search-wrap {
  position: relative; flex: 1; min-width: 200px;
}
.search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--brun); opacity: .5; pointer-events: none;
}
.search-input {
  width: 100%; padding: 12px 16px 12px 40px;
  border: 2px solid #e8ddd0; border-radius: 999px;
  font-size: .92rem; background: var(--creme);
  color: var(--noir); outline: none; transition: all .25s;
}
.search-input:focus {
  border-color: var(--or); background: #fff;
  box-shadow: 0 0 0 4px rgba(249,178,51,.1);
}
.btn-create {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 22px; background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; border: none; border-radius: 999px;
  font-size: .86rem; font-weight: 700; cursor: pointer;
  white-space: nowrap; transition: all .25s;
  box-shadow: 0 6px 18px rgba(89,55,22,.2);
}
.btn-create:hover { transform: translateY(-1px); filter: brightness(1.06); }

/* Loading & Empty */
.admins-loading {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 60px 20px; color: var(--brun); font-weight: 700;
  font-size: 1rem; opacity: .7;
}
.admins-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 60px 20px; text-align: center;
}
.admins-empty-icon {
  width: 80px; height: 80px;
  background: rgba(132,89,54,.08); border: 2px dashed rgba(132,89,54,.2);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: rgba(132,89,54,.4);
}
.admins-empty-icon.text-red {
  background: rgba(177, 34, 42, 0.08);
  border-color: rgba(177, 34, 42, 0.2);
  color: var(--rouge);
}
.admins-empty p { color: var(--brun); opacity: .7; font-size: .95rem; margin: 0; }
.text-red { color: var(--rouge); }

/* Users list table layout */
.admins-list {
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
}
.user-email-col {
  font-weight: 700;
  color: var(--noir);
}
.user-email-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.84rem;
  font-weight: 900;
  box-shadow: 0 2px 8px rgba(89, 55, 22, 0.15);
}
.self-badge {
  font-size: 0.72rem;
  background: rgba(132, 89, 54, 0.1);
  color: var(--brun);
  padding: 2px 8px;
  border-radius: 6px;
  margin-left: 6px;
}

/* Role badges */
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 700;
}
.role-badge.super_admin {
  background: rgba(249, 178, 51, 0.12);
  color: #8a6600;
  border: 1px solid rgba(249, 178, 51, 0.25);
}
.role-badge.admin {
  background: rgba(132, 89, 54, 0.08);
  color: var(--brun);
  border: 1px solid rgba(132, 89, 54, 0.15);
}

.btn-delete-user {
  background: rgba(177, 34, 42, 0.07);
  color: var(--rouge);
  border: 1.5px solid rgba(177, 34, 42, 0.2);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-delete-user:hover:not(:disabled) {
  background: var(--rouge);
  color: #fff;
}
.btn-delete-user:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* Modals and Forms */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,16,8,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: fadeIn .2s ease;
  backdrop-filter: blur(2px);
}
.modal-box {
  width: 100%; max-width: 500px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  animation: modalIn .3s cubic-bezier(.34,1.56,.64,1);
}
.modal-confirm { max-width: 480px; }
.confirm-text { font-size: .92rem; color: #555; line-height: 1.6; margin: 0 0 24px; }

.ev-form-actions {
  display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;
}
.btn-cancel {
  padding: 12px 22px; background: none;
  border: 2px solid rgba(132,89,54,.2); border-radius: 12px;
  color: var(--brun); font-size: .88rem; font-weight: 700; cursor: pointer;
  transition: all .2s;
}
.btn-cancel:hover { border-color: var(--brun); background: rgba(132,89,54,.06); }
.ev-form .bsub { width: auto; padding: 12px 28px; margin-top: 0; }

.ev-form-error {
  display: flex; align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px;
  padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600;
  margin-top: 12px;
}

@media (max-width: 600px) {
  .ev-form-actions { flex-direction: column-reverse; }
  .btn-cancel, .ev-form .bsub { width: 100%; text-align: center; justify-content: center; }
}
</style>
