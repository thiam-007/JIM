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
              <th>Prénom & Nom</th>
              <th>Institution</th>
              <th>Statut</th>
              <th>Date d'inscription</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in paginatedSubscribers" :key="sub.id">
              <td><strong>{{ sub.email }}</strong></td>
              <td>{{ sub.prenom || sub.nom ? `${sub.prenom || ''} ${sub.nom || ''}`.trim() : '-' }}</td>
              <td>{{ sub.institution || '-' }}</td>
              <td>
                <span class="status-badge" :class="sub.statut === 'actif' ? 'status-valide' : 'status-annule'">
                  {{ sub.statut }}
                </span>
              </td>
              <td>{{ formatDate(sub.created_at) }}</td>
              <td class="actions-cell text-right">
                <button class="btn-icon edit" @click="openEditSubscriberModal(sub)" title="Modifier" style="margin-right: 5px;">
                  <AppIcon name="edit" :size="16" />
                </button>
                <button class="btn-icon delete" @click="confirmDeleteSubscriber(sub)" title="Supprimer">
                  <AppIcon name="trash" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination Abonnés -->
        <div class="pagination" v-if="totalPagesSubscribers > 1">
          <button @click="currentPageSubscribers--" :disabled="currentPageSubscribers === 1" class="page-btn"><AppIcon name="chevron-left" :size="16" /></button>
          <span class="page-info">Page {{ currentPageSubscribers }} sur {{ totalPagesSubscribers }}</span>
          <button @click="currentPageSubscribers++" :disabled="currentPageSubscribers === totalPagesSubscribers" class="page-btn"><AppIcon name="chevron-right" :size="16" /></button>
        </div>
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
              <th>Statistiques</th>
              <th>Statut</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="camp in paginatedCampaigns" :key="camp.id">
              <td><strong>{{ camp.titre_interne }}</strong></td>
              <td>{{ camp.sujet_email }}</td>
              <td><span class="jim-badge" style="color: #000;">{{ camp.type_source }}</span></td>
              <td>{{ formatDate(camp.date_envoi || camp.created_at) }}</td>
              <td>
                <div v-if="camp.statut === 'envoye'" style="display: flex; gap: 10px; align-items: center; font-size: 13px;">
                  <span style="color: #2e7d32; display: flex; align-items: center; gap: 4px;">
                    <AppIcon name="check-circle" :size="14" /> {{ camp.success_count || 0 }}
                  </span>
                  <span v-if="camp.fail_count > 0" @click="viewFailedEmails(camp)" style="color: #c62828; display: flex; align-items: center; gap: 4px; cursor: pointer; text-decoration: underline;" title="Voir les échecs">
                    <AppIcon name="x-circle" :size="14" /> {{ camp.fail_count }}
                  </span>
                  <span v-else style="color: #9e9e9e; display: flex; align-items: center; gap: 4px;">
                    <AppIcon name="x-circle" :size="14" /> 0
                  </span>
                </div>
                <span v-else style="color: #757575; font-size: 13px;">—</span>
              </td>
              <td>
                <span class="status-badge" :class="camp.statut === 'envoye' ? 'status-valide' : 'status-attente'">
                  {{ formatStatut(camp.statut) }}
                </span>
              </td>
              <td class="actions-cell text-right">
                <button class="btn-icon" @click="viewCampaignPreview(camp)" title="Aperçu de la campagne" style="background: rgba(132,89,54,0.08); color: var(--brun);">
                  <AppIcon name="eye" :size="16" />
                </button>
                <button class="btn-icon" @click="duplicateCampaign(camp)" title="Dupliquer / Renvoyer" style="background: rgba(132,89,54,0.08); color: var(--brun);">
                  <AppIcon name="copy" :size="16" />
                </button>
                <button class="btn-icon delete" @click="confirmDeleteCampaign(camp)" title="Supprimer">
                  <AppIcon name="trash" :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination Campagnes -->
        <div class="pagination" v-if="totalPagesCampaigns > 1">
          <button @click="currentPageCampaigns--" :disabled="currentPageCampaigns === 1" class="page-btn"><AppIcon name="chevron-left" :size="16" /></button>
          <span class="page-info">Page {{ currentPageCampaigns }} sur {{ totalPagesCampaigns }}</span>
          <button @click="currentPageCampaigns++" :disabled="currentPageCampaigns === totalPagesCampaigns" class="page-btn"><AppIcon name="chevron-right" :size="16" /></button>
        </div>
      </div>
    </div>

    <!-- Failed Emails Modal -->
    <Teleport to="body">
      <div v-if="showFailedEmailsModal" class="modal-backdrop" @click.self="showFailedEmailsModal = false">
        <div class="modal-box form-card" style="max-width: 500px;">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="alert-circle" :size="22" style="color: #c62828;" /></div>
            <div class="fh-title">E-mails échoués</div>
          </div>
          <div class="fb" style="padding: 24px;">
            <p style="margin: 0 0 16px; font-size: 14px; color: var(--text-color);">
              Ces destinataires n'ont pas pu recevoir la campagne (probablement rejeté par le pare-feu de leur institution).
            </p>
            <textarea readonly rows="8" style="width: 100%; box-sizing: border-box; padding: 12px; font-family: monospace; font-size: 13px; border: 1px solid var(--border-color); border-radius: 4px; background: #fafafa; margin-bottom: 16px;">{{ failedEmailsList.join('\n') }}</textarea>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button class="btn-cancel" @click="showFailedEmailsModal = false">Fermer</button>
              <button class="btn-create" style="background: var(--brun); color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;" @click="copyFailedEmails">
                <AppIcon name="copy" :size="14" /> Copier la liste
              </button>
            </div>
            <div v-if="copySuccess" style="text-align: right; color: #2e7d32; font-size: 12px; margin-top: 8px;">
              Copié dans le presse-papier !
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Create Campaign Modal -->
    <Teleport to="body">
      <div v-if="showCampaignModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box modal-campaign form-card">
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
                  <label>📌 En bref ce mois-ci <span style="font-weight:400;color:#888;font-size:11px;">(articles ou événements cliquables)</span></label>

                  <!-- Puces sélectionnées -->
                  <div v-if="form.bulletin.editoBref.filter(i=>i.text).length > 0" style="margin-bottom:10px;">
                    <div v-for="(item, idx) in form.bulletin.editoBref.filter(i=>i.text)" :key="idx"
                      style="display:flex;align-items:center;gap:8px;background:rgba(132,89,54,0.07);border:1px solid rgba(132,89,54,0.18);border-radius:6px;padding:7px 10px;margin-bottom:6px;">
                      <span style="font-size:12px;color:#593716;flex:1;font-weight:500;">▸ {{ item.text }}</span>
                      <span v-if="item.url" style="font-size:10px;color:#845936;opacity:0.7;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" :title="item.url">{{ item.url }}</span>
                      <button type="button" @click="form.bulletin.editoBref.splice(form.bulletin.editoBref.indexOf(item), 1)"
                        style="background:none;border:none;color:#B1222A;font-size:16px;cursor:pointer;padding:0;line-height:1;flex-shrink:0;" title="Retirer">✕</button>
                    </div>
                  </div>

                  <!-- Sélecteur déroulant -->
                  <div style="border:1px solid rgba(132,89,54,0.25);border-radius:6px;overflow:hidden;">
                    <div style="background:rgba(132,89,54,0.04);padding:8px 10px;font-size:11px;font-weight:700;color:#845936;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(132,89,54,0.12);">
                      📰 Articles
                    </div>
                    <div style="max-height:140px;overflow-y:auto;">
                      <div v-if="actualites.length === 0" style="padding:12px;font-size:12px;color:#999;font-style:italic;">Aucun article disponible</div>
                      <div v-for="act in actualites" :key="'act-'+act.id"
                        :style="form.bulletin.editoBref.some(i=>i._id===act.id && i._type==='actu') ? 'opacity:0.4;pointer-events:none;' : ''"
                        @click="form.bulletin.editoBref.push({ text: act.titre, url: '', _id: act.id, _type: 'actu' }); form.bulletin.editoBref = form.bulletin.editoBref.filter(i=>i.text)"
                        style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(132,89,54,0.06);transition:background 0.15s;"
                        @mouseenter="$event.currentTarget.style.background='rgba(132,89,54,0.07)'"
                        @mouseleave="$event.currentTarget.style.background='transparent'">
                        <span style="font-size:18px;">📄</span>
                        <span style="font-size:12px;color:#4A3020;">{{ act.titre }}</span>
                      </div>
                    </div>

                    <div style="background:rgba(132,89,54,0.04);padding:8px 10px;font-size:11px;font-weight:700;color:#845936;text-transform:uppercase;letter-spacing:1px;border-top:1px solid rgba(132,89,54,0.12);border-bottom:1px solid rgba(132,89,54,0.12);">
                      📅 Événements
                    </div>
                    <div style="max-height:140px;overflow-y:auto;">
                      <div v-if="evenements.length === 0" style="padding:12px;font-size:12px;color:#999;font-style:italic;">Aucun événement disponible</div>
                      <div v-for="ev in evenements" :key="'ev-'+ev.id"
                        :style="form.bulletin.editoBref.some(i=>i._id===ev.id && i._type==='ev') ? 'opacity:0.4;pointer-events:none;' : ''"
                        @click="form.bulletin.editoBref.push({ text: ev.titre, url: '', _id: ev.id, _type: 'ev' }); form.bulletin.editoBref = form.bulletin.editoBref.filter(i=>i.text)"
                        style="display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid rgba(132,89,54,0.06);transition:background 0.15s;"
                        @mouseenter="$event.currentTarget.style.background='rgba(132,89,54,0.07)'"
                        @mouseleave="$event.currentTarget.style.background='transparent'">
                        <span style="font-size:18px;">🗓️</span>
                        <span style="font-size:12px;color:#4A3020;">{{ ev.titre }}</span>
                      </div>
                    </div>
                  </div>
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

                <!-- Editeur de médias Zoom -->
                <div class="newsletter-sub-section">
                  <div class="sub-section-header">
                    <label>Médias du Zoom (Images/Vidéos)</label>
                    <button type="button" class="btn-sub-action" @click="addZoomMedia">
                      <AppIcon name="plus" :size="14" /> Ajouter un média
                    </button>
                  </div>
                  <div v-if="form.bulletin.zoomMedia && form.bulletin.zoomMedia.length > 0" class="builder-media-list">
                    <div v-for="(media, index) in form.bulletin.zoomMedia" :key="index" class="media-builder-card">
                      <div class="media-card-header">
                        <span class="media-index">Média #{{ index + 1 }}</span>
                        <div class="media-order-buttons">
                          <button type="button" class="btn-icon-small" :disabled="index === 0" @click="moveZoomMedia(index, -1)">
                            <AppIcon name="chevron-up" :size="12" />
                          </button>
                          <button type="button" class="btn-icon-small" :disabled="index === form.bulletin.zoomMedia.length - 1" @click="moveZoomMedia(index, 1)">
                            <AppIcon name="chevron-down" :size="12" />
                          </button>
                          <button type="button" class="btn-icon-small delete" @click="removeZoomMedia(index)">
                            <AppIcon name="trash" :size="12" />
                          </button>
                        </div>
                      </div>
                      <div class="media-card-body">
                        <div class="media-fields-row">
                          <div class="fg-half">
                            <label>Type</label>
                            <select v-model="media.type">
                              <option value="image">Image</option>
                              <option value="video">Vidéo (YouTube/Vimeo)</option>
                            </select>
                          </div>
                          <div class="fg-half">
                            <label>Téléverser image / Lien source</label>
                            <div class="upload-inline-group">
                              <input type="text" v-model="media.url" placeholder="https://..." />
                              <button type="button" class="btn-inline-upload" @click="triggerZoomMediaUpload(index)">
                                <AppIcon name="upload" :size="14" />
                              </button>
                              <input type="file" :id="'zoom-media-file-' + index" accept="image/*" @change="uploadZoomMediaFile($event, index)" style="display: none;" />
                            </div>
                          </div>
                        </div>
                        <div class="fg" style="margin-top: 8px;">
                          <label>Lien de redirection (Optionnel)</label>
                          <input type="url" v-model="media.link" placeholder="Ex: https://youtube.com/... ou page web" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-media-msg">Aucun média ajouté. Le zoom s'affichera uniquement en texte.</div>
                </div>

                <div style="border-top: 1px solid rgba(132,89,54,0.1); margin: 20px 0;"></div>
                <h4 style="margin: 0 0 10px; color: var(--brun-fonce);">Prochaines Étapes</h4>
                <div class="fg">
                  <label>Livrables ou événements (Format: Titre | Description, une par ligne)</label>
                  <textarea v-model="form.bulletin.etapesText" rows="3" placeholder="Atelier de collecte | Avec les communautés locales...&#10;Réunion | Réunion de coordination..."></textarea>
                </div>

                <!-- Editeur Galerie Visuelle de fin -->
                <div class="newsletter-sub-section">
                  <div class="sub-section-header">
                    <label>Galerie Visuelle de Fin (Avant le footer)</label>
                    <button type="button" class="btn-sub-action" @click="addGalerieMedia">
                      <AppIcon name="plus" :size="14" /> Ajouter un visuel
                    </button>
                  </div>
                  <div class="fg" style="margin-bottom: 12px;">
                    <label>Titre de la Galerie</label>
                    <input type="text" v-model="form.bulletin.galerie.titre" placeholder="Ex: Rétrospective visuelle, En images..." />
                  </div>
                  
                  <div v-if="form.bulletin.galerie && form.bulletin.galerie.medias && form.bulletin.galerie.medias.length > 0" class="builder-media-list">
                    <div v-for="(media, index) in form.bulletin.galerie.medias" :key="index" class="media-builder-card">
                      <div class="media-card-header">
                        <span class="media-index">Visuel #{{ index + 1 }}</span>
                        <div class="media-order-buttons">
                          <button type="button" class="btn-icon-small" :disabled="index === 0" @click="moveGalerieMedia(index, -1)">
                            <AppIcon name="chevron-up" :size="12" />
                          </button>
                          <button type="button" class="btn-icon-small" :disabled="index === form.bulletin.galerie.medias.length - 1" @click="moveGalerieMedia(index, 1)">
                            <AppIcon name="chevron-down" :size="12" />
                          </button>
                          <button type="button" class="btn-icon-small delete" @click="removeGalerieMedia(index)">
                            <AppIcon name="trash" :size="12" />
                          </button>
                        </div>
                      </div>
                      <div class="media-card-body">
                        <div class="media-fields-row">
                          <div class="fg-third">
                            <label>Type</label>
                            <select v-model="media.type">
                              <option value="image">Image</option>
                              <option value="video">Vidéo</option>
                            </select>
                          </div>
                          <div class="fg-two-thirds">
                            <label>Téléverser image / Lien source</label>
                            <div class="upload-inline-group">
                              <input type="text" v-model="media.url" placeholder="https://..." />
                              <button type="button" class="btn-inline-upload" @click="triggerGalerieMediaUpload(index)">
                                <AppIcon name="upload" :size="14" />
                              </button>
                              <input type="file" :id="'galerie-media-file-' + index" accept="image/*" @change="uploadGalerieMediaFile($event, index)" style="display: none;" />
                            </div>
                          </div>
                        </div>
                        <div class="media-fields-row" style="margin-top: 8px;">
                          <div class="fg-half">
                            <label>Titre / Légende</label>
                            <input type="text" v-model="media.titre" placeholder="Titre du visuel" />
                          </div>
                          <div class="fg-half">
                            <label>Lien (Clic)</label>
                            <input type="url" v-model="media.link" placeholder="Lien vers la vidéo/page" />
                          </div>
                        </div>
                        <div class="fg" style="margin-top: 8px;">
                          <label>Description courte (Optionnel)</label>
                          <input type="text" v-model="media.description" placeholder="Courte légende explicative..." />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="empty-media-msg">Aucun élément visuel ajouté en fin de newsletter.</div>
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
                    <option value="domaine">Par domaine / extension</option>
                  </select>
                </div>
              </div>

              <div class="fg" v-if="form.ciblage === 'specifique'">
                <label>Sélectionnez les destinataires <span class="req">*</span></label>
                <div class="checkbox-list">
                  <label v-for="sub in activeSubscribers" :key="sub.id" class="checkbox-label">
                    <input type="checkbox" :value="sub.id" v-model="form.destinataires" />
                    <span>{{ sub.email }}</span>
                  </label>
                </div>
              </div>

              <div class="fg" v-if="form.ciblage === 'domaine'">
                <label>Domaines d'email (séparés par des virgules) <span class="req">*</span></label>
                <input type="text" v-model="form.domaines" placeholder="Ex: .fr, .gn, @outlook.com" />
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                  <span style="font-size: 13px; color: var(--brun);">{{ matchingSubscribersByDomain.length }} destinataire(s) correspondant(s)</span>
                  <button type="button" @click="copyDomainsEmails" class="btn-cancel" style="padding: 6px 12px; font-size: 12px; display: flex; align-items: center; gap: 4px;" v-if="matchingSubscribersByDomain.length > 0">
                    <AppIcon name="copy" :size="14" /> Copier ces e-mails (Outlook)
                  </button>
                </div>
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
        <div class="modal-box modal-preview form-card">
          <div class="fh fh-a" style="flex-shrink: 0;">
            <div class="fh-icon"><AppIcon name="eye" :size="22" /></div>
            <div class="fh-title">Aperçu de la Newsletter</div>
          </div>
          <div class="fb" style="flex: 1; padding: 0; background: #fff;">
            <iframe :srcdoc="previewHtml" style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
          <div style="padding: 15px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fff;">
            <button class="btn-create" style="background: #0078D4; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;" @click="downloadForOutlook" title="Télécharger un fichier .eml pour l'ouvrir dans Outlook">
              <AppIcon name="download" :size="16" /> Télécharger pour Outlook
            </button>
            <button class="btn-cancel" @click="showPreviewModal = false">Fermer l'aperçu</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Campaign Modal -->
    <Teleport to="body">
      <div v-if="showDeleteCampaignModal" class="modal-backdrop" @click.self="showDeleteCampaignModal = false">
        <div class="modal-box modal-confirm form-card">
          <div class="fh fh-a">
            <div class="fh-icon" style="background: rgba(177,34,42,0.1); color: var(--rouge);"><AppIcon name="trash" :size="24" /></div>
            <div class="fh-title" style="color: var(--rouge);">Supprimer la campagne</div>
          </div>
          <div class="fb">
            <p>Êtes-vous sûr de vouloir supprimer définitivement la campagne <strong>{{ deletingCampaign?.titre_interne }}</strong> ?</p>
            <p style="font-size: 13px; color: #666;">Cette action ne supprimera pas l'e-mail des boîtes de réception de vos abonnés, mais elle effacera l'historique ici.</p>
            <div class="ev-form-actions">
              <button type="button" class="btn-cancel" @click="showDeleteCampaignModal = false">Annuler</button>
              <button type="button" class="bsub bsub-a" style="background: linear-gradient(135deg, var(--rouge), #ff4d4d); box-shadow: 0 4px 12px rgba(177,34,42,0.3);" @click="deleteCampaign" :disabled="saving">
                <AppIcon :name="saving ? 'loader' : 'trash'" :size="16" />
                {{ saving ? 'Suppression…' : 'Oui, supprimer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Subscriber Modal -->
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
              Collez les adresses e-mail de vos contacts (séparées par des virgules ou des retours à la ligne), ou importez un fichier Excel (.xlsx, .csv).
            </p>
            <form @submit.prevent="submitAddSubscribers" class="ev-form">
              <div class="fg" style="margin-bottom: 20px;">
                <label>Importer depuis un fichier Excel / CSV</label>
                <input type="file" accept=".xlsx, .xls, .csv" @change="handleFileUpload" />
                <div v-if="parsedSubscribers.length > 0" style="margin-top: 10px; font-size: 13px; color: #2e7d32;">
                  <AppIcon name="check-circle" :size="14" style="vertical-align: middle;" />
                  {{ parsedSubscribers.length }} contact(s) extrait(s) du fichier.
                </div>
              </div>
              <div class="fg">
                <label>Ou collez manuellement (e-mails uniquement)</label>
                <textarea v-model="newEmailsText" rows="6" placeholder="email1@exemple.com&#10;email2@exemple.com"></textarea>
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

    <!-- Modale Éditer un abonné -->
    <Teleport to="body">
      <div v-if="showEditSubscriberModal" class="modal-backdrop" @click.self="showEditSubscriberModal = false">
        <div class="modal-box form-card" style="max-width: 500px;">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="edit" :size="22" /></div>
            <div class="fh-title">Modifier l'abonné</div>
          </div>
          <div class="fb">
            <form @submit.prevent="submitEditSubscriber" class="ev-form">
              <div class="fg">
                <label>Prénom</label>
                <input type="text" v-model="editingSubscriber.prenom" placeholder="Prénom" />
              </div>
              <div class="fg">
                <label>Nom</label>
                <input type="text" v-model="editingSubscriber.nom" placeholder="Nom" />
              </div>
              <div class="fg">
                <label>E-mail</label>
                <input type="email" v-model="editingSubscriber.email" required placeholder="Email" />
              </div>
              <div class="fg">
                <label>Institution / Entité</label>
                <input type="text" v-model="editingSubscriber.institution" placeholder="Institution" />
              </div>
              <div class="fg">
                <label>Fonction</label>
                <input type="text" v-model="editingSubscriber.fonction" placeholder="Fonction" />
              </div>

              <div v-if="editSubscriberError" class="ev-form-error">
                <AppIcon name="alert-triangle" :size="15" /> {{ editSubscriberError }}
              </div>
              <div v-if="editSubscriberSuccess" class="ev-form-success" style="color: #2e7d32; background: #e8f5e9; border: 1px solid #4caf50; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 13px;">
                {{ editSubscriberSuccess }}
              </div>

              <div class="ev-form-actions">
                <button type="button" class="btn-cancel" @click="showEditSubscriberModal = false">Annuler</button>
                <button type="submit" class="bsub bsub-a" :disabled="saving">
                  <AppIcon :name="saving ? 'loader' : 'check'" :size="16" />
                  {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
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
import * as XLSX from 'xlsx'
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
const showDeleteCampaignModal = ref(false)
const showPreviewModal = ref(false)
const showAddSubscriberModal = ref(false)
const showEditSubscriberModal = ref(false)
const showFailedEmailsModal = ref(false)
const previewHtml = ref('')
const deletingSubscriber = ref(null)
const editingSubscriber = ref(null)
const deletingCampaign = ref(null)
const newEmailsText = ref('')
const parsedSubscribers = ref([])
const addSubscriberError = ref('')
const addSubscriberSuccess = ref('')
const editSubscriberError = ref('')
const editSubscriberSuccess = ref('')
const failedEmailsList = ref([])
const copySuccess = ref(false)

const itemsPerPage = 25
const currentPageSubscribers = ref(1)
const currentPageCampaigns = ref(1)

const paginatedSubscribers = computed(() => {
  const start = (currentPageSubscribers.value - 1) * itemsPerPage
  return subscribers.value.slice(start, start + itemsPerPage)
})
const totalPagesSubscribers = computed(() => Math.ceil(subscribers.value.length / itemsPerPage) || 1)

const paginatedCampaigns = computed(() => {
  const start = (currentPageCampaigns.value - 1) * itemsPerPage
  return campaigns.value.slice(start, start + itemsPerPage)
})
const totalPagesCampaigns = computed(() => Math.ceil(campaigns.value.length / itemsPerPage) || 1)

const form = ref({
  titre_interne: '',
  sujet_email: '',
  type_source: 'manuel',
  source_id: '',
  contenu_personnalise: '',
  linkUrl: '',
  ciblage: 'tous',
  destinataires: [],
  domaines: '',
  bulletin: {
    edition: 'Édition N°01 — ' + new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
    editoTitre: '',
    editoTexte: '',
    editoAuteurNom: '',
    editoAuteurRole: '',
    editoAuteurInitiales: '',
    editoBref: [{ text: '', url: '' }],
    actus: ['', '', ''],
    zoomTitre: '',
    zoomTexte: '',
    etapesText: ''
  }
})

const activeSubscribers = computed(() => subscribers.value.filter(s => s.statut === 'actif'))

const matchingSubscribersByDomain = computed(() => {
  if (!form.value.domaines) return []
  const domainsList = form.value.domaines.split(',').map(d => d.trim().toLowerCase()).filter(d => d)
  if (domainsList.length === 0) return []
  return activeSubscribers.value.filter(sub => 
    domainsList.some(domain => sub.email.toLowerCase().endsWith(domain))
  )
})

async function copyDomainsEmails() {
  const emails = matchingSubscribersByDomain.value.map(s => s.email).join('; ')
  if (!emails) return
  try {
    await navigator.clipboard.writeText(emails)
    alert("Adresses e-mail copiées ! Vous pouvez les coller dans le champ Cci d'Outlook.")
  } catch (err) {
    console.error(err)
    alert("Erreur lors de la copie.")
  }
}

onMounted(async () => {
  await fetchData()
})

async function fetchData() {
  loading.value = true
  try {
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
    contenu_personnalise: '', linkUrl: '', ciblage: 'tous', destinataires: [], domaines: '',
    bulletin: {
      edition: 'Édition N°01 — ' + new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
      editoTitre: '', editoTexte: '', editoAuteurNom: '', editoAuteurRole: '', editoAuteurInitiales: '',
      editoBref: [{ text: '', url: '' }], actus: ['', '', ''], zoomTitre: '', zoomTexte: '',
      zoomMedia: [],
      galerie: {
        titre: 'Galerie Photos & Vidéos',
        medias: []
      },
      etapesText: ''
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

  let finalCiblage = form.value.ciblage;
  let finalDestinataires = form.value.destinataires;
  if (form.value.ciblage === 'domaine') {
    const matched = matchingSubscribersByDomain.value;
    if (matched.length === 0) {
      formError.value = "Aucun destinataire ne correspond à ces domaines."
      return
    }
    finalCiblage = 'specifique';
    finalDestinataires = matched.map(s => s.id);
  }

  saving.value = true
  try {
    const res = await api.post('/api/newsletter/campaigns', { ...form.value, ciblage: finalCiblage, destinataires: finalDestinataires })
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

async function viewCampaignPreview(camp) {
  previewing.value = true
  try {
    const res = await api.post('/api/newsletter/preview', {
      type_source: camp.type_source,
      source_id: camp.source_id,
      contenu_personnalise: camp.contenu_personnalise,
      sujet_email: camp.sujet_email
    })
    previewHtml.value = res.html
    showPreviewModal.value = true
  } catch (err) {
    console.error("Erreur aperçu campagne:", err)
    alert("Impossible d'afficher l'aperçu.")
  } finally {
    previewing.value = false
  }
}

function duplicateCampaign(camp) {
  formError.value = ''
  form.value = {
    titre_interne: camp.titre_interne + ' (Copie)',
    sujet_email: camp.sujet_email,
    type_source: camp.type_source,
    source_id: camp.source_id || '',
    contenu_personnalise: '',
    linkUrl: '',
    ciblage: camp.ciblage,
    destinataires: camp.destinataires || [],
    domaines: '',
    bulletin: {
      edition: 'Édition N°01 — ' + new Date().toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}),
      editoTitre: '', editoTexte: '', editoAuteurNom: '', editoAuteurRole: '', editoAuteurInitiales: '',
      editoBref: [{ text: '', url: '' }], actus: ['', '', ''], zoomTitre: '', zoomTexte: '',
      zoomMedia: [],
      galerie: {
        titre: 'Galerie Photos & Vidéos',
        medias: []
      },
      etapesText: ''
    }
  }

  if (camp.type_source === 'manuel') {
    form.value.contenu_personnalise = camp.contenu_personnalise || ''
  } else if (camp.type_source === 'bulletin' && camp.contenu_personnalise) {
    try {
      const bData = JSON.parse(camp.contenu_personnalise)
      form.value.bulletin.edition = bData.edition || ''
      form.value.bulletin.editoTitre = bData.editoTitre || ''
      form.value.bulletin.editoTexte = bData.editoTexte || ''
      form.value.bulletin.editoAuteurNom = bData.editoAuteurNom || ''
      form.value.bulletin.editoAuteurRole = bData.editoAuteurRole || ''
      form.value.bulletin.editoAuteurInitiales = bData.editoAuteurInitiales || ''
      if (bData.editoBref && bData.editoBref.length) {
        // Supporte l'ancien format (string[]) ET le nouveau format ({text,url}[])
        form.value.bulletin.editoBref = bData.editoBref.map(i =>
          typeof i === 'string' ? { text: i, url: '' } : { text: i.text || '', url: i.url || '' }
        );
        if (form.value.bulletin.editoBref.length === 0) {
          form.value.bulletin.editoBref = [{ text: '', url: '' }];
        }
      }
      if (bData.actus_ids && bData.actus_ids.length) {
        form.value.bulletin.actus = [
          bData.actus_ids[0] || '',
          bData.actus_ids[1] || '',
          bData.actus_ids[2] || ''
        ]
      }
      form.value.bulletin.zoomTitre = bData.zoomTitre || ''
      form.value.bulletin.zoomTexte = bData.zoomTexte || ''
      form.value.bulletin.zoomMedia = bData.zoomMedia || []
      form.value.bulletin.galerie = bData.galerie || { titre: 'Galerie Photos & Vidéos', medias: [] }
      if (bData.etapes && bData.etapes.length) {
        form.value.bulletin.etapesText = bData.etapes.map(e => `${e.titre} | ${e.desc}`).join('\n')
      }
    } catch (e) {
      console.error("Erreur parsing bulletin pour duplication", e)
    }
  }

  showCampaignModal.value = true
}

function packBulletinData() {
  const b = form.value.bulletin;
  const etapes = b.etapesText.split('\n').filter(Boolean).map(line => {
    const parts = line.split('|');
    return { titre: parts[0] ? parts[0].trim() : '', desc: parts[1] ? parts[1].trim() : '' };
  });
  const frontendOrigin = window.location.origin;
  const editoBref = (b.editoBref || [])
    .filter(item => item.text && item.text.trim())
    .map(item => {
      // Construire l'URL automatiquement depuis le type/id si pas d'URL manuelle
      let url = item.url && item.url.trim() ? item.url.trim() : null;
      if (!url && item._type && item._id) {
        if (item._type === 'actu') url = `${frontendOrigin}/actualites/${item._id}`;
        else if (item._type === 'ev') url = `${frontendOrigin}/evenements/${item._id}`;
      }
      return { text: item.text.trim(), url };
    });
  
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
    zoomMedia: b.zoomMedia || [],
    galerie: b.galerie || { titre: 'Galerie Photos & Vidéos', medias: [] },
    etapes
  };
  form.value.contenu_personnalise = JSON.stringify(bulletinData);
}

// Media list management helpers for bulletin builder
function addZoomMedia() {
  if (!form.value.bulletin.zoomMedia) form.value.bulletin.zoomMedia = []
  form.value.bulletin.zoomMedia.push({ type: 'image', url: '', link: '' })
}

function removeZoomMedia(index) {
  form.value.bulletin.zoomMedia.splice(index, 1)
}

function moveZoomMedia(index, direction) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= form.value.bulletin.zoomMedia.length) return
  const temp = form.value.bulletin.zoomMedia[index]
  form.value.bulletin.zoomMedia[index] = form.value.bulletin.zoomMedia[targetIndex]
  form.value.bulletin.zoomMedia[targetIndex] = temp
}

function triggerZoomMediaUpload(index) {
  const el = document.getElementById('zoom-media-file-' + index)
  if (el) el.click()
}

// ─── Compression d'image côté client (canvas) ──────────────────────────────
// Redimensionne l'image à max 1600px de large et la compresse en JPEG 85%
// avant l'envoi au serveur. Évite les crashs 502/413 (Entity Too Large) sur Render.
function compressImage(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Canvas non disponible dans ce navigateur'))
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const compressed = canvas.toDataURL('image/jpeg', quality)
        URL.revokeObjectURL(objectUrl)
        resolve({ base64: compressed, name: file.name.replace(/\.[^.]+$/, '.jpg'), mimeType: 'image/jpeg' })
      } catch (canvasErr) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Erreur lors de la compression : ' + canvasErr.message))
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Impossible de charger l’image (fichier corrompu ou format non supporté)'))
    }

    img.src = objectUrl
  })
}

async function uploadZoomMediaFile(event, index) {
  const file = event.target.files[0]
  if (!file) return
  
  saving.value = true
  try {
    const isImage = file.type.startsWith('image/')
    let payload

    if (isImage) {
      try {
        payload = await compressImage(file)
      } catch (compressErr) {
        console.warn('[upload] Compression échouée, envoi brut :', compressErr.message)
        // Fallback brut
        payload = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = () => reject(new Error('Impossible de lire le fichier'))
          reader.onload = (e) => resolve({ base64: e.target.result, name: file.name, mimeType: file.type })
          reader.readAsDataURL(file)
        })
      }
    } else {
      // Vidéo ou autre
      payload = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Impossible de lire le fichier vidéo'))
        reader.onload = (e) => resolve({ base64: e.target.result, name: file.name, mimeType: file.type })
        reader.readAsDataURL(file)
      })
    }

    const res = await api.post('/api/actualites/upload', {
      file: payload.base64,
      fileName: payload.name,
      mimeType: payload.mimeType
    })
    form.value.bulletin.zoomMedia[index].url = res.url
  } catch (err) {
    alert("Erreur upload: " + (err.message || err))
  } finally {
    saving.value = false
    event.target.value = ''
  }
}

function addGalerieMedia() {
  if (!form.value.bulletin.galerie) {
    form.value.bulletin.galerie = { titre: 'Galerie Photos & Vidéos', medias: [] }
  }
  if (!form.value.bulletin.galerie.medias) {
    form.value.bulletin.galerie.medias = []
  }
  form.value.bulletin.galerie.medias.push({ type: 'image', url: '', link: '', titre: '', description: '' })
}

function removeGalerieMedia(index) {
  form.value.bulletin.galerie.medias.splice(index, 1)
}

function moveGalerieMedia(index, direction) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= form.value.bulletin.galerie.medias.length) return
  const temp = form.value.bulletin.galerie.medias[index]
  form.value.bulletin.galerie.medias[index] = form.value.bulletin.galerie.medias[targetIndex]
  form.value.bulletin.galerie.medias[targetIndex] = temp
}

function triggerGalerieMediaUpload(index) {
  const el = document.getElementById('galerie-media-file-' + index)
  if (el) el.click()
}

async function uploadGalerieMediaFile(event, index) {
  const file = event.target.files[0]
  if (!file) return
  
  saving.value = true
  try {
    const isImage = file.type.startsWith('image/')
    let payload

    if (isImage) {
      try {
        payload = await compressImage(file)
      } catch (compressErr) {
        console.warn('[upload] Compression échouée, envoi brut :', compressErr.message)
        // Fallback brut
        payload = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onerror = () => reject(new Error('Impossible de lire le fichier'))
          reader.onload = (e) => resolve({ base64: e.target.result, name: file.name, mimeType: file.type })
          reader.readAsDataURL(file)
        })
      }
    } else {
      payload = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Impossible de lire le fichier vidéo'))
        reader.onload = (e) => resolve({ base64: e.target.result, name: file.name, mimeType: file.type })
        reader.readAsDataURL(file)
      })
    }

    const res = await api.post('/api/actualites/upload', {
      file: payload.base64,
      fileName: payload.name,
      mimeType: payload.mimeType
    })
    form.value.bulletin.galerie.medias[index].url = res.url
  } catch (err) {
    alert("Erreur upload: " + (err.message || err))
  } finally {
    saving.value = false
    event.target.value = ''
  }
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

function openEditSubscriberModal(sub) {
  editingSubscriber.value = { ...sub }
  editSubscriberError.value = ''
  editSubscriberSuccess.value = ''
  showEditSubscriberModal.value = true
}

async function submitEditSubscriber() {
  editSubscriberError.value = ''
  editSubscriberSuccess.value = ''
  saving.value = true
  try {
    const res = await api.put(`/api/newsletter/subscribers/${editingSubscriber.value.id}`, editingSubscriber.value)
    if (res.subscriber) {
      const idx = subscribers.value.findIndex(s => s.id === res.subscriber.id)
      if (idx !== -1) {
        subscribers.value[idx] = res.subscriber
      }
    }
    editSubscriberSuccess.value = res.message
    setTimeout(() => {
      showEditSubscriberModal.value = false
    }, 1000)
  } catch (err) {
    editSubscriberError.value = err.message || "Erreur lors de la modification de l'abonné."
  } finally {
    saving.value = false
  }
}
function confirmDeleteCampaign(camp) {
  deletingCampaign.value = camp
  showDeleteCampaignModal.value = true
}

async function deleteCampaign() {
  if (!deletingCampaign.value) return
  saving.value = true
  try {
    await api.del(`/api/newsletter/campaigns/${deletingCampaign.value.id}`)
    campaigns.value = campaigns.value.filter(c => c.id !== deletingCampaign.value.id)
    showDeleteCampaignModal.value = false
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
    deletingCampaign.value = null
  }
}

function openAddSubscriberModal() {
  newEmailsText.value = ''
  parsedSubscribers.value = []
  addSubscriberError.value = ''
  addSubscriberSuccess.value = ''
  showAddSubscriberModal.value = true
}

function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  addSubscriberError.value = ''
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      
      let extracted = []
      
      json.forEach(row => {
        const emailKey = Object.keys(row).find(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('e-mail'))
        const email = emailKey ? row[emailKey] : null
        if (!email) return

        let prenom = null, nom = null, institution = null, fonction = null

        const nomPrenomKey = Object.keys(row).find(k => k.toLowerCase().includes('nom prénom') || k.toLowerCase().includes('nom prenom'))
        if (nomPrenomKey && row[nomPrenomKey]) {
           const parts = String(row[nomPrenomKey]).trim().split(' ')
           if (parts.length > 1) {
             nom = parts[0]
             prenom = parts.slice(1).join(' ')
           } else {
             nom = parts[0]
           }
        } else {
           const pKey = Object.keys(row).find(k => k.toLowerCase() === 'prénom' || k.toLowerCase() === 'prenom' || k.toLowerCase() === 'civilité')
           const nKey = Object.keys(row).find(k => k.toLowerCase() === 'nom')
           if (pKey) prenom = row[pKey]
           if (nKey) nom = row[nKey]
        }

        const instKey = Object.keys(row).find(k => k.toLowerCase().includes('institution') || k.toLowerCase().includes('entité') || k.toLowerCase().includes('entite'))
        if (instKey) institution = row[instKey]

        const fKey = Object.keys(row).find(k => k.toLowerCase().includes('fonction') || k.toLowerCase().includes('statut'))
        if (fKey) fonction = row[fKey]

        extracted.push({
          email: String(email).trim(),
          prenom: prenom ? String(prenom).trim() : '',
          nom: nom ? String(nom).trim() : '',
          institution: institution ? String(institution).trim() : '',
          fonction: fonction ? String(fonction).trim() : ''
        })
      })
      
      parsedSubscribers.value = extracted
    } catch(err) {
      addSubscriberError.value = "Erreur lors de la lecture du fichier Excel."
      console.error(err)
    }
  }
  reader.readAsArrayBuffer(file)
}

async function submitAddSubscribers() {
  addSubscriberError.value = ''
  addSubscriberSuccess.value = ''
  
  const emailsFromText = newEmailsText.value.split(/[\n,; ]+/).map(e => e.trim()).filter(Boolean)
  
  const payloadSubscribers = [...parsedSubscribers.value]
  emailsFromText.forEach(e => {
    payloadSubscribers.push({ email: e })
  })
  
  if (payloadSubscribers.length === 0) {
    addSubscriberError.value = "Veuillez entrer ou importer au moins un e-mail."
    return
  }

  saving.value = true
  try {
    const res = await api.post('/api/newsletter/admin/add-subscribers', { subscribers: payloadSubscribers })
    addSubscriberSuccess.value = res.message
    if (res.newSubscribers && res.newSubscribers.length > 0) {
      subscribers.value.unshift(...res.newSubscribers)
    }
    newEmailsText.value = ''
    parsedSubscribers.value = []
  } catch (err) {
    addSubscriberError.value = err.message || "Erreur lors de l'ajout des abonnés."
  } finally {
    saving.value = false
  }
}
function viewFailedEmails(camp) {
  failedEmailsList.value = camp.failed_emails || []
  copySuccess.value = false
  showFailedEmailsModal.value = true
}

async function copyFailedEmails() {
  if (failedEmailsList.value.length === 0) return
  try {
    await navigator.clipboard.writeText(failedEmailsList.value.join('\n'))
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 3000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

function downloadForOutlook() {
  if (!previewHtml.value) return;
  const subject = form.value.sujet_email || 'Newsletter_Musee';
  // Use a simple unescape(encodeURIComponent) hack to convert utf8 to binary string for btoa
  let subjectB64 = '';
  try {
    subjectB64 = btoa(unescape(encodeURIComponent(subject)));
  } catch(e) {
    subjectB64 = btoa('Newsletter');
  }
  
  const emlContent = `X-Unsent: 1\r\nSubject: =?utf-8?B?${subjectB64}?=\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${previewHtml.value}`;

  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `newsletter_${new Date().toISOString().split('T')[0]}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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

@media (max-width: 768px) {
  .btn-icon {
    width: 44px; height: 44px;
  }
}

.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(26,16,8,.55); display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(2px); }
.modal-box { width: 100%; max-height: calc(100vh - 40px); overflow-y: auto; }
/* Modal campagne : max 700px, fluide sur mobile */
.modal-campaign { max-width: min(700px, calc(100vw - 40px)); }
/* Modal aperçu : hauteur dynamique safe */
.modal-preview { max-width: min(800px, calc(100vw - 40px)); height: min(90vh, calc(100svh - 40px)); display: flex; flex-direction: column; }
.modal-confirm { max-width: 480px; }
.ev-form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-cancel { padding: 12px 22px; background: none; border: 2px solid rgba(132,89,54,.2); border-radius: 12px; color: var(--brun); font-weight: 700; cursor: pointer; transition: all .2s; }
.btn-cancel:hover { border-color: var(--brun); background: rgba(132,89,54,.06); }
.ev-form-error { display: flex; align-items: center; gap: 8px; background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px; padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600; margin-top: 12px; }

.checkbox-list {
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid rgba(132, 89, 54, 0.2);
  border-radius: 8px;
  padding: 12px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  cursor: pointer;
  color: var(--brun-fonce);
  margin: 0;
}
.checkbox-label input[type="checkbox"] {
  accent-color: var(--brun);
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin: 0;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid rgba(132, 89, 54, 0.1);
}
.page-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(132, 89, 54, 0.2);
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--brun);
  transition: all 0.2s;
}
.page-btn:hover:not(:disabled) {
  background: rgba(132, 89, 54, 0.05);
  border-color: var(--brun);
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.page-info {
  font-size: 13px;
  font-weight: 600;
  color: var(--brun-fonce);
}

/* Newsletter builder new sub sections */
.newsletter-sub-section {
  background: rgba(132, 89, 54, 0.02);
  border: 1px solid rgba(132, 89, 54, 0.1);
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
}
.sub-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.sub-section-header label {
  font-weight: 700;
  color: var(--brun-fonce);
  margin: 0;
}
.btn-sub-action {
  background: white;
  border: 1.5px solid var(--brun);
  color: var(--brun);
  padding: 6px 12px;
  font-size: 0.78rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}
.btn-sub-action:hover {
  background: var(--brun);
  color: white;
}
.builder-media-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.media-builder-card {
  background: white;
  border: 1.5px solid rgba(132, 89, 54, 0.15);
  border-radius: 8px;
  padding: 12px;
}
.media-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #f4eae0;
  margin-bottom: 10px;
}
.media-index {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--brun);
}
.media-order-buttons {
  display: flex;
  gap: 4px;
}
.btn-icon-small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
}
.btn-icon-small:hover:not(:disabled) {
  border-color: var(--brun);
  color: var(--brun);
  background: #fdfaf6;
}
.btn-icon-small.delete:hover {
  border-color: var(--rouge);
  color: var(--rouge);
  background: #ffebeb;
}
.btn-icon-small:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.media-fields-row {
  display: flex;
  gap: 12px;
}
.fg-half {
  flex: 1;
}
.fg-third {
  flex: 1;
}
.fg-two-thirds {
  flex: 2;
}
.upload-inline-group {
  display: flex;
  gap: 6px;
  width: 100%;
}
.upload-inline-group input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1.5px solid rgba(132, 89, 54, 0.15);
  font-size: 0.88rem;
}
.btn-inline-upload {
  background: var(--creme);
  border: 1.5px solid rgba(132, 89, 54, 0.2);
  color: var(--brun);
  width: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-inline-upload:hover {
  background: var(--brun);
  color: white;
  border-color: var(--brun);
}
.empty-media-msg {
  font-size: 0.8rem;
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 14px 0;
  border: 1px dashed rgba(132, 89, 54, 0.15);
  border-radius: 6px;
  background: white;
}
</style>
