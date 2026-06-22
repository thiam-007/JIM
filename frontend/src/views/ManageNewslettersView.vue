<template>
  <div class="manage-newsletters-shell">
    <div class="manage-newsletters-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="mail" :size="24" /></div>
        <div class="fh-title">Gestion des Newsletters</div>
        <div class="fh-sub">Gérez vos abonnés et envoyez des campagnes ciblées.</div>
      </div>
      <div class="header-actions fb" style="display: flex; gap: 10px;">
        <button class="tab-btn" :class="{ active: currentTab === 'subscribers' }" @click="currentTab = 'subscribers'">
          Abonnés ({{ subscribers.length }})
        </button>
        <button class="tab-btn" :class="{ active: currentTab === 'campaigns' }" @click="currentTab = 'campaigns'">
          Campagnes ({{ campaigns.length }})
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="actus-loading">
      <AppIcon name="loader" :size="32" class="spin" />
      <span>Chargement…</span>
    </div>

    <!-- TAB: SUBSCRIBERS -->
    <div v-else-if="currentTab === 'subscribers'">
      <div class="campaign-actions" style="margin-bottom: 20px; text-align: right;">
        <button class="btn-create" @click="openAddSubscriberModal">
          <AppIcon name="user-plus" :size="16" /> Ajouter des abonnés
        </button>
      </div>

      <div v-if="subscribers.length === 0" class="actus-empty">
        <div class="actus-empty-icon"><AppIcon name="users" :size="40" /></div>
        <p>Aucun abonné pour le moment.</p>
      </div>
      <div v-else class="table-container form-card">
        <table class="jim-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Statut</th>
              <th>Date d'inscription</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in subscribers" :key="sub.id">
              <td><strong>{{ sub.email }}</strong></td>
              <td>
                <span class="status-badge" :class="sub.statut === 'actif' ? 'status-valide' : 'status-annule'">
                  {{ sub.statut }}
                </span>
              </td>
              <td>{{ formatDate(sub.created_at) }}</td>
              <td class="actions-cell text-right">
                <button class="btn-icon delete" @click="confirmDeleteSubscriber(sub)" title="Supprimer">
                  <AppIcon name="trash" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB: CAMPAIGNS -->
    <div v-else-if="currentTab === 'campaigns'">
      <div class="campaign-actions" style="margin-bottom: 20px; text-align: right;">
        <button class="btn-create" @click="openCreateCampaign">
          <AppIcon name="send" :size="16" /> Nouvelle Campagne
        </button>
      </div>

      <div v-if="campaigns.length === 0" class="actus-empty">
        <div class="actus-empty-icon"><AppIcon name="mail" :size="40" /></div>
        <p>Aucune campagne envoyée.</p>
      </div>
      <div v-else class="table-container form-card">
        <table class="jim-table">
          <thead>
            <tr>
              <th>Titre Interne</th>
              <th>Sujet</th>
              <th>Type</th>
              <th>Date d'envoi</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="camp in campaigns" :key="camp.id">
              <td><strong>{{ camp.titre_interne }}</strong></td>
              <td>{{ camp.sujet_email }}</td>
              <td><span class="jim-badge" style="color: #000;">{{ camp.type_source }}</span></td>
              <td>{{ formatDate(camp.date_envoi || camp.created_at) }}</td>
              <td>
                <span class="status-badge" :class="camp.statut === 'envoye' ? 'status-valide' : 'status-attente'">
                  {{ formatStatut(camp.statut) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Campaign Modal -->
    <Teleport to="body">
      <div v-if="showCampaignModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box form-card" style="max-width: 700px;">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="send" :size="22" /></div>
            <div class="fh-title">Envoyer une Campagne</div>
          </div>
          <div class="fb">
            <form @submit.prevent="submitCampaign" class="ev-form">
              <div class="fg">
                <label>Nom interne de la campagne <span class="req">*</span></label>
                <input type="text" v-model="form.titre_interne" required placeholder="Ex: Newsletter de Juin" />
              </div>
              <div class="fg">
                <label>Sujet de l'email <span class="req">*</span></label>
                <input type="text" v-model="form.sujet_email" required placeholder="Le sujet que les destinataires verront" />
              </div>
              
              <div class="fr">
                <div class="fg">
                  <label>Type de contenu <span class="req">*</span></label>
                  <select v-model="form.type_source" required @change="form.source_id = ''">
                    <option value="manuel">Manuel (Texte libre)</option>
                    <option value="actualite">Actualité existante</option>
                    <option value="evenement">Événement existant</option>
                    <option value="bulletin">Bulletin Mensuel (Complet)</option>
                  </select>
                </div>
                
                <div class="fg" v-if="form.type_source === 'actualite'">
                  <label>Sélectionnez l'actualité <span class="req">*</span></label>
                  <select v-model="form.source_id" required>
                    <option disabled value="">Choisir une actualité...</option>
                    <option v-for="act in actualites" :key="act.id" :value="act.id">{{ act.titre }}</option>
                  </select>
                </div>
                
                <div class="fg" v-if="form.type_source === 'evenement'">
                  <label>Sélectionnez l'événement <span class="req">*</span></label>
                  <select v-model="form.source_id" required>
                    <option disabled value="">Choisir un événement...</option>
                    <option v-for="ev in evenements" :key="ev.id" :value="ev.id">{{ ev.titre }}</option>
                  </select>
                </div>
              </div>

              <!-- BULLETIN BUILDER -->
              <div v-if="form.type_source === 'bulletin'" style="background: rgba(132,89,54,0.03); padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(132,89,54,0.1);">
                <h3 style="margin: 0 0 15px; color: var(--brun);">Paramètres du Bulletin</h3>
                
                <div class="fg">
                  <label>Mention d'Édition</label>
                  <input type="text" v-model="form.bulletin.edition" placeholder="Ex: Édition N°01 — Avril 2026" />
                </div>

                <div style="border-top: 1px solid rgba(132,89,54,0.1); margin: 20px 0;"></div>
                <h4 style="margin: 0 0 10px; color: var(--brun-fonce);">L'Édito</h4>
                <div class="fg">
                  <label>Titre de l'édito</label>
                  <input type="text" v-model="form.bulletin.editoTitre" placeholder="Ex: Valoriser notre héritage..." />
                </div>
                <div class="fg">
                  <label>Texte de l'édito</label>
                  <textarea v-model="form.bulletin.editoTexte" rows="4"></textarea>
                </div>
                <div class="fr">
                  <div class="fg">
                    <label>Auteur (Nom)</label>
                    <input type="text" v-model="form.bulletin.editoAuteurNom" placeholder="Nom Prénom" />
                  </div>
                  <div class="fg">
                    <label>Auteur (Rôle)</label>
                    <input type="text" v-model="form.bulletin.editoAuteurRole" placeholder="Ex: Cheffe de projet" />
                  </div>
                  <div class="fg">
                    <label>Initiales (Avatar)</label>
                    <input type="text" v-model="form.bulletin.editoAuteurInitiales" placeholder="Ex: CP" maxlength="3" />
                  </div>
                </div>
                <div class="fg">
                  <label>En bref ce mois-ci (Une ligne par puce)</label>
                  <textarea v-model="form.bulletin.editoBrefText" rows="3" placeholder="- Lancement de la newsletter&#10;- Finalisation de la charte"></textarea>
                </div>

                <div style="border-top: 1px solid rgba(132,89,54,0.1); margin: 20px 0;"></div>
                <h4 style="margin: 0 0 10px; color: var(--brun-fonce);">Les 3 Actualités</h4>
                <div class="fr">
                  <div class="fg">
                    <label>Actualité 1 (À la une)</label>
                    <select v-model="form.bulletin.actus[0]">
                      <option value="">Aucune</option>
                      <option v-for="act in actualites" :key="act.id" :value="act.id">{{ act.titre }}</option>
                    </select>
                  </div>
                  <div class="fg">
                    <label>Actualité 2</label>
                    <select v-model="form.bulletin.actus[1]">
                      <option value="">Aucune</option>
                      <option v-for="act in actualites" :key="act.id" :value="act.id">{{ act.titre }}</option>
                    </select>
                  </div>
                  <div class="fg">
                    <label>Actualité 3</label>
                    <select v-model="form.bulletin.actus[2]">
                      <option value="">Aucune</option>
                      <option v-for="act in actualites" :key="act.id" :value="act.id">{{ act.titre }}</option>
                    </select>
                  </div>
                </div>

                <div style="border-top: 1px solid rgba(132,89,54,0.1); margin: 20px 0;"></div>
                <h4 style="margin: 0 0 10px; color: var(--brun-fonce);">Zoom sur...</h4>
                <div class="fg">
                  <label>Titre du Zoom</label>
                  <input type="text" v-model="form.bulletin.zoomTitre" placeholder="Ex: Incub'Action" />
                </div>
                <div class="fg">
                  <label>Texte du Zoom</label>
                  <textarea v-model="form.bulletin.zoomTexte" rows="4"></textarea>
                </div>

                <div style="border-top: 1px solid rgba(132,89,54,0.1); margin: 20px 0;"></div>
                <h4 style="margin: 0 0 10px; color: var(--brun-fonce);">Prochaines Étapes</h4>
                <div class="fg">
                  <label>Livrables ou événements (Format: Titre | Description, une par ligne)</label>
                  <textarea v-model="form.bulletin.etapesText" rows="3" placeholder="Atelier de collecte | Avec les communautés locales...&#10;Réunion | Réunion de coordination..."></textarea>
                </div>
              </div>

              <div class="fg" v-if="form.type_source === 'manuel'">
                <label>Contenu de l'email <span class="req">*</span></label>
                <textarea v-model="form.contenu_personnalise" required rows="6" placeholder="Bonjour, voici les nouveautés..."></textarea>
              </div>

              <div class="fg" v-if="form.type_source === 'manuel'">
                <label>Lien du bouton (Optionnel, si vous voulez ajouter un bouton qui redirige vers une page)</label>
                <input type="url" v-model="form.linkUrl" placeholder="Ex: https://museevirtuelguinee.com/page-speciale" />
              </div>

              <div class="fr" style="margin-top: 15px;">
                <div class="fg">
                  <label>Ciblage <span class="req">*</span></label>
                  <select v-model="form.ciblage" required>
                    <option value="tous">Tous les abonnés actifs</option>
                    <option value="specifique">Abonnés spécifiques</option>
                  </select>
                </div>
              </div>

              <div class="fg" v-if="form.ciblage === 'specifique'">
                <label>Sélectionnez les destinataires (Maintenez Ctrl/Cmd pour sélection multiple) <span class="req">*</span></label>
                <select v-model="form.destinataires" multiple required style="height: 120px;">
                  <option v-for="sub in activeSubscribers" :key="sub.id" :value="sub.id">{{ sub.email }}</option>
                </select>
              </div>

              <div v-if="formError" class="ev-form-error">
                <AppIcon name="alert-triangle" :size="15" /> {{ formError }}
              </div>

              <div class="ev-form-actions">
                <button type="button" class="btn-cancel" @click="previewCampaign" :disabled="previewing || saving">
                  <AppIcon :name="previewing ? 'loader' : 'eye'" :size="16" /> Prévisualiser
                </button>
                <div style="flex: 1;"></div>
                <button type="button" class="btn-cancel" @click="closeModal">Annuler</button>
                <button type="submit" class="bsub bsub-a" :disabled="saving || previewing">
                  <AppIcon :name="saving ? 'loader' : 'send'" :size="16" />
                  {{ saving ? 'Envoi en cours…' : 'Envoyer la campagne' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Preview Modal -->
    <Teleport to="body">
      <div v-if="showPreviewModal" class="modal-backdrop" @click.self="showPreviewModal = false">
        <div class="modal-box form-card" style="max-width: 800px; height: 90vh; display: flex; flex-direction: column;">
          <div class="fh fh-a" style="flex-shrink: 0;">
            <div class="fh-icon"><AppIcon name="eye" :size="22" /></div>
            <div class="fh-title">Aperçu de la Newsletter</div>
          </div>
          <div class="fb" style="flex: 1; padding: 0; background: #fff;">
            <iframe :srcdoc="previewHtml" style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
          <div style="padding: 15px; border-top: 1px solid #eee; text-align: right; background: #fff;">
            <button class="btn-cancel" @click="showPreviewModal = false">Fermer l'aperçu</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal-box modal-confirm form-card">
          <div class="fh fh-s">
            <div class="fh-icon"><AppIcon name="trash" :size="22" /></div>
            <div class="fh-title">Supprimer l'abonné</div>
          </div>
          <div class="fb">
            <p class="confirm-text">
              Voulez-vous supprimer <strong>{{ deletingSubscriber?.email }}</strong> ?
            </p>
            <div class="ev-form-actions">
              <button class="btn-cancel" @click="showDeleteModal = false">Annuler</button>
              <button class="bsub bsub-s" @click="doDeleteSubscriber" :disabled="saving">
                <AppIcon :name="saving ? 'loader' : 'trash'" :size="16" /> Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add Subscribers Modal -->
    <Teleport to="body">
      <div v-if="showAddSubscriberModal" class="modal-backdrop" @click.self="showAddSubscriberModal = false">
        <div class="modal-box form-card" style="max-width: 500px;">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="user-plus" :size="22" /></div>
            <div class="fh-title">Ajouter des abonnés</div>
          </div>
          <div class="fb">
            <p style="margin-bottom: 15px; font-size: 13px; color: var(--brun);">
              Collez les adresses e-mail de vos contacts (séparées par des virgules ou des retours à la ligne).
            </p>
            <form @submit.prevent="submitAddSubscribers" class="ev-form">
              <div class="fg">
                <textarea v-model="newEmailsText" required rows="6" placeholder="email1@exemple.com&#10;email2@exemple.com"></textarea>
              </div>
              
              <div v-if="addSubscriberError" class="ev-form-error">
                <AppIcon name="alert-triangle" :size="15" /> {{ addSubscriberError }}
              </div>
              <div v-if="addSubscriberSuccess" class="ev-form-success" style="color: #2e7d32; background: #e8f5e9; border: 1px solid #4caf50; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 13px;">
                {{ addSubscriberSuccess }}
              </div>

              <div class="ev-form-actions">
                <button type="button" class="btn-cancel" @click="showAddSubscriberModal = false">Fermer</button>
                <button type="submit" class="bsub bsub-a" :disabled="saving">
                  <AppIcon :name="saving ? 'loader' : 'check'" :size="16" />
                  {{ saving ? 'Ajout en cours…' : 'Ajouter' }}
                </button>
              </div>
            </form>
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

const currentTab = ref('subscribers')
const loading = ref(false)
const saving = ref(false)
const previewing = ref(false)
const formError = ref('')

const subscribers = ref([])
const campaigns = ref([])
const actualites = ref([])
const evenements = ref([])

const showCampaignModal = ref(false)
const showDeleteModal = ref(false)
const showPreviewModal = ref(false)
const showAddSubscriberModal = ref(false)
const previewHtml = ref('')
const deletingSubscriber = ref(null)
const newEmailsText = ref('')
const addSubscriberError = ref('')
const addSubscriberSuccess = ref('')

const form = ref({
  titre_interne: '',
  sujet_email: '',
  type_source: 'manuel',
  source_id: '',
  contenu_personnalise: '',
  linkUrl: '',
  ciblage: 'tous',
  destinataires: [],
  bulletin: {
    edition: 'Édition N°01 — ' + new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
    editoTitre: '',
    editoTexte: '',
    editoAuteurNom: '',
    editoAuteurRole: '',
    editoAuteurInitiales: '',
    editoBrefText: '',
    actus: ['', '', ''],
    zoomTitre: '',
    zoomTexte: '',
    etapesText: ''
  }
})

const activeSubscribers = computed(() => subscribers.value.filter(s => s.statut === 'actif'))

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    // Les appels sont faits séparément pour éviter qu'une erreur sur l'un (ex: table manquante) ne bloque tout
    const [subs, camps, acts, evs] = await Promise.all([
      api.get('/api/newsletter/subscribers').catch(e => { console.error('Subscribers error:', e); return []; }),
      api.get('/api/newsletter/campaigns').catch(e => { console.error('Campaigns error:', e); return []; }),
      api.get('/api/actualites').catch(e => { console.error('Actualites error:', e); return []; }),
      api.get('/api/evenements').catch(e => { console.error('Evenements error:', e); return []; })
    ])
    subscribers.value = subs || []
    campaigns.value = camps || []
    actualites.value = acts || []
    evenements.value = evs || []
  } catch (err) {
    console.error("Erreur chargement données newsletter", err)
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'
  }).format(new Date(dateStr))
}

function formatStatut(statut) {
  if (statut === 'en_cours') return 'En cours';
  if (statut === 'envoye') return 'Envoyé';
  if (statut === 'brouillon') return 'Brouillon';
  return statut;
}

function openCreateCampaign() {
  formError.value = ''
  form.value = {
    titre_interne: '', sujet_email: '', type_source: 'manuel', source_id: '',
    contenu_personnalise: '', linkUrl: '', ciblage: 'tous', destinataires: [],
    bulletin: {
      edition: 'Édition N°01 — ' + new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
      editoTitre: '', editoTexte: '', editoAuteurNom: '', editoAuteurRole: '', editoAuteurInitiales: '',
      editoBrefText: '', actus: ['', '', ''], zoomTitre: '', zoomTexte: '', etapesText: ''
    }
  }
  showCampaignModal.value = true
}

function closeModal() {
  showCampaignModal.value = false
}

async function submitCampaign() {
  formError.value = ''
  if (form.value.ciblage === 'specifique' && form.value.destinataires.length === 0) {
    formError.value = "Veuillez sélectionner au moins un destinataire."
    return
  }
  if (form.value.type_source !== 'manuel' && form.value.type_source !== 'bulletin' && !form.value.source_id) {
    formError.value = "Veuillez sélectionner l'actualité ou l'événement."
    return
  }
  
  if (form.value.type_source === 'bulletin') {
    packBulletinData();
  }

  saving.value = true
  try {
    const res = await api.post('/api/newsletter/campaigns', form.value)
    if (res.campaign) {
      campaigns.value.unshift(res.campaign)
    }
    closeModal()
  } catch (err) {
    formError.value = err.message || "Erreur lors de l'envoi de la campagne"
  } finally {
    saving.value = false
  }
}

async function previewCampaign() {
  formError.value = ''
  if (form.value.type_source !== 'manuel' && form.value.type_source !== 'bulletin' && !form.value.source_id) {
    formError.value = "Veuillez sélectionner l'actualité ou l'événement pour la prévisualisation."
    return
  }

  if (form.value.type_source === 'bulletin') {
    packBulletinData();
  }

  previewing.value = true
  try {
    const res = await api.post('/api/newsletter/preview', {
      type_source: form.value.type_source,
      source_id: form.value.source_id,
      contenu_personnalise: form.value.contenu_personnalise,
      sujet_email: form.value.sujet_email
    })
    previewHtml.value = res.html
    showPreviewModal.value = true
  } catch (err) {
    formError.value = err.message || "Erreur lors de la prévisualisation"
  } finally {
    previewing.value = false
  }
}

function packBulletinData() {
  const b = form.value.bulletin;
  const etapes = b.etapesText.split('\\n').filter(Boolean).map(line => {
    const parts = line.split('|');
    return { titre: parts[0] ? parts[0].trim() : '', desc: parts[1] ? parts[1].trim() : '' };
  });
  const editoBref = b.editoBrefText.split('\\n').map(l => l.replace(/^-/, '').trim()).filter(Boolean);
  
  const bulletinData = {
    edition: b.edition,
    editoTitre: b.editoTitre,
    editoTexte: b.editoTexte,
    editoAuteurNom: b.editoAuteurNom,
    editoAuteurRole: b.editoAuteurRole,
    editoAuteurInitiales: b.editoAuteurInitiales,
    editoBref,
    actus_ids: b.actus.filter(Boolean),
    zoomTitre: b.zoomTitre,
    zoomTexte: b.zoomTexte,
    etapes
  };
  form.value.contenu_personnalise = JSON.stringify(bulletinData);
}

function confirmDeleteSubscriber(sub) {
  deletingSubscriber.value = sub
  showDeleteModal.value = true
}

async function doDeleteSubscriber() {
  if (!deletingSubscriber.value) return
  saving.value = true
  try {
    await api.del(`/api/newsletter/subscribers/${deletingSubscriber.value.id}`)
    subscribers.value = subscribers.value.filter(s => s.id !== deletingSubscriber.value.id)
    showDeleteModal.value = false
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
    deletingSubscriber.value = null
  }
}

function openAddSubscriberModal() {
  newEmailsText.value = ''
  addSubscriberError.value = ''
  addSubscriberSuccess.value = ''
  showAddSubscriberModal.value = true
}

async function submitAddSubscribers() {
  addSubscriberError.value = ''
  addSubscriberSuccess.value = ''
  
  if (!newEmailsText.value.trim()) {
    addSubscriberError.value = "Veuillez entrer au moins un e-mail."
    return
  }

  // Split by comma, semicolon, space, or newline
  const emails = newEmailsText.value.split(/[\n,; ]+/).map(e => e.trim()).filter(Boolean)
  
  if (emails.length === 0) return

  saving.value = true
  try {
    const res = await api.post('/api/newsletter/admin/add-subscribers', { emails })
    addSubscriberSuccess.value = res.message
    if (res.newSubscribers && res.newSubscribers.length > 0) {
      subscribers.value.unshift(...res.newSubscribers)
    }
    newEmailsText.value = ''
  } catch (err) {
    addSubscriberError.value = err.message || "Erreur lors de l'ajout des abonnés."
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.manage-newsletters-shell { display: flex; flex-direction: column; gap: 24px; }
.actus-loading { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 60px 20px; color: var(--brun); font-weight: 700; opacity: .7; }
.actus-empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; text-align: center; }
.actus-empty-icon { width: 80px; height: 80px; background: rgba(132,89,54,.08); border: 2px dashed rgba(132,89,54,.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(132,89,54,.4); }

.tab-btn {
  padding: 10px 20px;
  background: rgba(255,255,255,0.5);
  border: 1px solid rgba(132, 89, 54, 0.2);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  color: var(--brun);
  transition: all 0.2s;
}
.tab-btn.active {
  background: var(--brun);
  color: #fff;
  border-color: var(--brun);
}

.btn-create {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 22px; background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; border: none; border-radius: 999px;
  font-size: .86rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 18px rgba(89,55,22,.2); transition: all .2s;
}
.btn-create:hover { filter: brightness(1.1); transform: translateY(-1px); }

.table-container { overflow-x: auto; padding: 0; border-radius: 14px; }
.jim-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.jim-table th, .jim-table td { padding: 16px 20px; text-align: left; border-bottom: 1px solid rgba(132,89,54,.1); font-size: 0.9rem; }
.jim-table th { background: #fdf6ed; font-weight: 700; color: var(--brun); text-transform: uppercase; letter-spacing: 1px; font-size: 0.8rem; }
.text-right { text-align: right !important; }

.status-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.status-valide { background: rgba(76,175,80,.15); color: #2e7d32; }
.status-attente { background: rgba(249,178,51,.2); color: #c98b18; }
.status-annule { background: rgba(177,34,42,.15); color: var(--rouge); }

.actions-cell { display: flex; justify-content: flex-end; gap: 8px; }
.btn-icon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; }
.btn-icon.delete { background: rgba(177,34,42,.08); color: var(--rouge); }
.btn-icon.delete:hover { background: var(--rouge); color: #fff; }

.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(26,16,8,.55); display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(2px); }
.modal-box { width: 100%; max-height: calc(100vh - 40px); overflow-y: auto; }
.modal-confirm { max-width: 480px; }
.ev-form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-cancel { padding: 12px 22px; background: none; border: 2px solid rgba(132,89,54,.2); border-radius: 12px; color: var(--brun); font-weight: 700; cursor: pointer; transition: all .2s; }
.btn-cancel:hover { border-color: var(--brun); background: rgba(132,89,54,.06); }
.ev-form-error { display: flex; align-items: center; gap: 8px; background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px; padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600; margin-top: 12px; }
</style>
