<template>
  <div class="home-wrapper">
    <!-- ─── En-tête / Hero Section ─── -->
    <section class="hero-section" v-reveal="0">
      <div class="hero-bg">
        <Transition name="hero-fade">
          <div :key="activeHeroSlide.id || activeHeroSlide.ordre" class="hero-slide">
            <img v-if="activeHeroSlide.media_type !== 'video'" :src="activeHeroSlide.media_url || activeHeroSlide.image" class="hero-img" />
            <video v-else :src="activeHeroSlide.media_url" class="hero-img" autoplay loop muted playsinline></video>
            <div class="hero-overlay"></div>
          </div>
        </Transition>
      </div>
      <div class="hero-content">
        <div class="hero-badge">Musée Virtuel de Guinée</div>
        <div class="hero-text-wrapper">
          <Transition name="text-fade">
            <div :key="activeHeroSlide.id || activeHeroSlide.ordre" class="hero-copy-shell">
              <h1 class="hero-title">
                <span class="text-light">{{ activeHeroSlide.titre_secondaire || activeHeroSlide.preTitle }}</span><br />
                <span class="text-gold">{{ activeHeroSlide.titre_principal || activeHeroSlide.mainTitle }}</span>
              </h1>
              <p class="hero-subtitle">
                {{ activeHeroSlide.sous_titre || activeHeroSlide.subtitle }}
              </p>
            </div>
          </Transition>
        </div>

        <div class="hero-dots" aria-label="Navigation du carrousel">
          <button
            v-for="(slide, index) in heroSlides"
            :key="slide.id"
            type="button"
            class="hero-dot"
            :class="{ active: currentHeroSlide === index }"
            @click="goToHeroSlide(index)"
            :aria-label="`Voir la slide ${index + 1}`"
          />
        </div>
      </div>

      <div v-if="!api.isConnected" class="hero-ctas-bottom">
        <RouterLink to="/a-propos" class="btn-primary-custom">
          <AppIcon name="info" :size="16" /> Découvrir le Projet
        </RouterLink>
        <button v-if="isAdminDomain" @click="triggerLogin" class="btn-secondary-custom">
          <AppIcon name="lock" :size="16" /> Accès Équipe
        </button>
      </div>
    </section>

    <!-- ─── CONNECTED: Admin Dashboard ─── -->
    <template v-if="api.isConnected">
      <!-- ─── Tableau de Bord Analytique (Les KPI Flash) ─── -->
      <section class="kpi-section" v-reveal="100">
        <div class="section-title-wrap">
          <h2>Chiffres Clés</h2>
          <div class="section-divider"></div>
        </div>

        <div class="kpi-grid">
          <!-- Card 1: Total Evenements -->
          <div class="kpi-card glass" v-tilt-3d>
            <div class="kpi-header">
              <span class="kpi-title">Total Événements</span>
              <div class="kpi-icon-wrap or"><AppIcon name="calendar" :size="20" /></div>
            </div>
            <div class="kpi-value-wrap">
              <span class="kpi-value">{{ kpiStats.total_evenements }}</span>
              <span class="kpi-sub">Projets passés & à venir</span>
            </div>
          </div>

          <!-- Card 2: Abonnés Newsletter -->
          <div class="kpi-card glass" v-tilt-3d>
            <div class="kpi-header">
              <span class="kpi-title">Abonnés</span>
              <div class="kpi-icon-wrap vert"><AppIcon name="users" :size="20" /></div>
            </div>
            <div class="kpi-value-wrap">
              <span class="kpi-value">{{ kpiStats.total_abonnes }}</span>
              <span class="kpi-sub">À la newsletter</span>
            </div>
          </div>


          <!-- Card 4: Campagnes envoyées -->
          <div class="kpi-card glass" v-tilt-3d>
            <div class="kpi-header">
              <span class="kpi-title">Campagnes</span>
              <div class="kpi-icon-wrap rouge"><AppIcon name="mail" :size="20" /></div>
            </div>
            <div class="kpi-value-wrap">
              <span class="kpi-value">{{ kpiStats.total_campagnes }}</span>
              <span class="kpi-sub">Newsletters expédiées</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── Focus "Événement en Cours" ou "Prochainement" ─── -->
      <section class="focus-section" v-reveal="150">
        <div v-if="activeEvent" class="focus-box active-mode form-card">
          <div class="fh fh-v">
            <div class="focus-badge pulse"><AppIcon name="zap" :size="14" /> Événement en cours (Jour-J)</div>
            <h2 class="focus-title">{{ activeEvent.titre }}</h2>
            <div class="focus-meta">
              <div class="meta-item"><AppIcon name="clock" :size="14" /> {{ formatTimeRange(activeEvent) }}</div>
              <div class="meta-item" v-if="activeEvent.lieu"><AppIcon name="map-pin" :size="14" /> {{ activeEvent.lieu }}</div>
              <div class="meta-item"><span class="format-pill" :class="activeEvent.format">{{ formatLabel(activeEvent.format) }}</span></div>
            </div>
          </div>
          <div class="fb focus-body">
            <p class="upcoming-desc">
              Cet événement est en cours. Lancez l'outil d'accueil et d'émargement pour scanner les invitations des participants et valider leurs entrées en temps réel.
            </p>
            <div class="focus-actions">
              <button class="btn-focus-action active-btn" @click="goToScan(activeEvent.id)">
                <AppIcon name="scan" :size="18" /> Lancer l'Émargement / Scanner QR
              </button>
            </div>
          </div>
        </div>

        <div v-else-if="nextEvent" class="focus-box upcoming-mode form-card">
          <div class="fh fh-a">
            <div class="focus-badge"><AppIcon name="calendar" :size="14" /> Prochainement</div>
            <h2 class="focus-title">{{ nextEvent.titre }}</h2>
            <div class="focus-meta">
              <div class="meta-item" v-if="nextEvent.date_debut"><AppIcon name="calendar" :size="14" /> {{ formatDate(nextEvent.date_debut) }}</div>
              <div class="meta-item" v-if="nextEvent.lieu"><AppIcon name="map-pin" :size="14" /> {{ nextEvent.lieu }}</div>
              <div class="meta-item"><span class="format-pill" :class="nextEvent.format">{{ formatLabel(nextEvent.format) }}</span></div>
            </div>
          </div>
          <div class="fb focus-body">
            <p class="upcoming-desc">
              Préparez cet événement en gérant les listes d'invités, en envoyant les invitations par e-mail ou en configurant le contrôle d'accès.
            </p>
            <div class="focus-actions">
              <button class="btn-focus-action" @click="goToInvitations(nextEvent.id)">
                <AppIcon name="mail" :size="16" /> Gérer les invitations
              </button>
              <button class="btn-focus-action secondary" @click="goToScan(nextEvent.id)">
                <AppIcon name="scan" :size="16" /> Préparer l'émargement
              </button>
            </div>
          </div>
        </div>

        <div v-else class="focus-box empty-mode form-card">
          <div class="fb text-center py-4">
            <AppIcon name="calendar" :size="32" class="opacity-50 mb-2" />
            <p>Aucun événement planifié pour le moment.</p>
            <button class="btn-focus-action mt-2 inline-flex" @click="openCreateEvent">
              <AppIcon name="plus" :size="16" /> Créer un événement
            </button>
          </div>
        </div>
      </section>

      <!-- ─── Grid double colonnes : Calendrier & Sidebar ─── -->
      <div class="dashboard-grid">
        <!-- Colonne Gauche : Calendrier / Liste -->
        <section class="grid-left" v-reveal="200">
          <div class="section-title-wrap">
            <h2>Événements à Venir</h2>
            <div class="section-divider"></div>
          </div>

          <div class="events-list">
            <div 
              v-for="evt in upcomingList" 
              :key="evt.id" 
              class="event-strip-card"
              @click="goToInvitations(evt.id)"
            >
              <div class="evt-strip-format">
                <span class="format-dot-badge" :class="evt.format"></span>
              </div>
              <div class="evt-strip-info">
                <h4 class="evt-strip-title">{{ evt.titre }}</h4>
                <div class="evt-strip-meta">
                  <span v-if="evt.date_debut"><AppIcon name="calendar" :size="12" /> {{ formatShortDate(evt.date_debut) }}</span>
                  <span v-if="evt.lieu"><AppIcon name="map-pin" :size="12" /> {{ evt.lieu }}</span>
                </div>
              </div>
              <div class="evt-strip-arrow">
                <AppIcon name="chevron-right" :size="16" />
              </div>
            </div>

            <div v-if="upcomingList.length === 0" class="empty-list-state">
              <p>Aucun événement à venir.</p>
            </div>
          </div>
        </section>

        <!-- Colonne Droite : Sidebar (Actions & Activité) ─── -->
        <aside class="grid-right" v-reveal="250">
          <!-- Actions Rapides -->
          <div class="sidebar-block form-card mb-4">
            <div class="fh fh-a py-3">
              <div class="fh-title font-sm">Actions Rapides</div>
            </div>
            <div class="fb py-3 flex-col gap-2">
              <button class="btn-sidebar-action ripple" @click="openCreateEvent">
                <div class="action-icon or"><AppIcon name="plus" :size="16" /></div>
                <span>Créer un nouvel événement</span>
              </button>
              <button class="btn-sidebar-action ripple" @click="openUrgentModal">
                <div class="action-icon rouge"><AppIcon name="send" :size="16" /></div>
                <span>Inviter un participant en urgence</span>
              </button>
              <button class="btn-sidebar-action ripple" @click="exportLastEventCSV" :disabled="!lastEvent">
                <div class="action-icon jaune"><AppIcon name="file-text" :size="16" /></div>
                <span>Exporter le rapport du dernier événement</span>
              </button>
              <button class="btn-sidebar-action ripple" @click="goToManageActualites">
                <div class="action-icon or"><AppIcon name="file-text" :size="16" /></div>
                <span>Gérer les actualités du site</span>
              </button>
            </div>
          </div>

        </aside>
      </div>
    </template>

    <!-- ─── DISCONNECTED: Visitor Landing Page ─── -->
    <template v-else>
      <!-- Présentation Générale / Vision -->
      <section class="visitor-intro-section" v-reveal="100">
        <div class="form-card intro-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="globe" :size="24" /></div>
            <div class="fh-title">Vision & Missions</div>
            <div class="fh-sub">Explorer, préserver et transmettre les cultures de Guinée à l'ère du numérique</div>
          </div>
          <div class="fb intro-body text-center">
            <p class="vision-lead">
              Le <strong>Musée Virtuel de Guinée (MVG)</strong> est une plateforme numérique innovante dédiée à la valorisation, la sauvegarde et au rayonnement international du patrimoine culturel guinéen.
            </p>
            <p class="vision-text">
              En alliant recherches de terrain et modélisation 3D de pointe, nous numérisons nos trésors patrimoniaux (masques rituels, instruments de musique, objets d'art) pour les rendre accessibles à tous et assurer leur transmission éternelle.
            </p>
            <div class="visitor-objectives-grid">
              <div class="v-obj-item">
                <div class="v-obj-icon"><AppIcon name="shield" :size="20" /></div>
                <h4>Préservation</h4>
                <p>Inventoriage, restauration et modélisation 3D haute définition d'objets précieux.</p>
              </div>
              <div class="v-obj-item">
                <div class="v-obj-icon"><AppIcon name="users" :size="20" /></div>
                <h4>Accessibilité</h4>
                <p>Mise en ligne universelle de nos galeries d'exposition et collections historiques.</p>
              </div>
              <div class="v-obj-item">
                <div class="v-obj-icon"><AppIcon name="globe" :size="20" /></div>
                <h4>Valorisation</h4>
                <p>Organisation d'expositions digitales immersives et médiation culturelle.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Piliers d'Activité -->
      <section class="formats-section" v-reveal="150">
        <div class="section-title-wrap text-center">
          <h2>Nos Piliers d'Activité</h2>
          <div class="section-divider mx-auto"></div>
        </div>
        <div class="formats-grid">
          <div class="format-card glass">
            <div class="format-icon theme-or"><AppIcon name="search" :size="24" /></div>
            <h3>Collecte &amp; Conservation</h3>
            <p>Missions régionales, documentation anthropologique, captation audiovisuelle et restauration.</p>
            <RouterLink to="/a-propos" class="format-link">En savoir plus <AppIcon name="arrow-right" :size="12" /></RouterLink>
          </div>
          <div class="format-card glass">
            <div class="format-icon theme-bleu"><AppIcon name="box" :size="24" /></div>
            <h3>Numérisation 3D</h3>
            <p>Acquisition photogrammétrique, traitement HD de textures et modélisation 3D d'objets d'art guinéens.</p>
            <RouterLink to="/a-propos" class="format-link">En savoir plus <AppIcon name="arrow-right" :size="12" /></RouterLink>
          </div>
          <div class="format-card glass">
            <div class="format-icon theme-rouge"><AppIcon name="video" :size="24" /></div>
            <h3>Production de Contenus</h3>
            <p>Films documentaires, capsules digitales éducatives et photographies artistiques d'œuvres.</p>
            <RouterLink to="/a-propos" class="format-link">En savoir plus <AppIcon name="arrow-right" :size="12" /></RouterLink>
          </div>
        </div>
      </section>

      <!-- Focus Chantier des Collections -->
      <section class="visitor-showcase-section" v-reveal="200">
        <div class="showcase-card form-card">
          <div class="showcase-grid">
            <div class="showcase-info">
              <span class="focus-pre"><AppIcon name="sparkles" :size="12" /> Action en cours</span>
              <h3 class="focus-main-title">Le Chantier des Collections</h3>
              <p>
                Un programme de grande envergure mené au Musée National de Guinée (Sandervalia) visant à inventorier, documenter, soigner et modéliser 3D nos collections pour les rendre durables.
              </p>
              <RouterLink to="/a-propos" class="btn-focus-action inline-flex">
                <AppIcon name="info" :size="16" /> Explorer le projet complet
              </RouterLink>
            </div>
            <div class="showcase-image-wrap">
              <img src="/images/side-photo.jpeg" alt="Numérisation 3D des masques" class="showcase-img" loading="lazy" />
              <div class="img-overlay-badge">Musée National de Guinée</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Showcase Galerie d'Art -->
      <section class="visitor-showcase-section" v-reveal="220">
        <div class="showcase-card form-card">
          <div class="showcase-grid">
            <div class="showcase-image-wrap">
              <img src="/images/stand-mvg.jpeg" alt="Exposition MVG" class="showcase-img" loading="lazy" />
              <div class="img-overlay-badge">Galerie &amp; Expositions Digitaux</div>
            </div>
            <div class="showcase-info">
              <span class="focus-pre"><AppIcon name="globe" :size="12" /> Immersion</span>
              <h3 class="focus-main-title">Participez à nos événements</h3>
              <p>
                L’immersion du Musée Virtuel de Guinée aux 72 Heures du Livre a offert aux visiteurs une expérience numérique innovante au cœur du patrimoine culturel guinéen. À travers des contenus interactifs et des découvertes virtuelles, le public a pu explorer l’histoire, les traditions, les objets patrimoniaux et la richesse culturelle de la Guinée, créant ainsi un pont entre mémoire, technologie et transmission du savoir.
              </p>
              <button v-if="isAdminDomain" @click="triggerLogin" class="btn-focus-action inline-flex">
                <AppIcon name="calendar" :size="16" /> Accès administrateur d'événements
              </button>
            </div>
          </div>
        </div>
      </section>



      <!-- ─── Galerie 3D du Patrimoine ─── -->
      <section class="gallery-3d-section" v-reveal="210">
        <div class="section-title-wrap text-center">
          <h2>Galerie 3D du Patrimoine</h2>
          <div class="section-divider mx-auto"></div>
          <p class="section-subtitle-3d">Explorez virtuellement nos trésors d'art et écoutez leurs histoires</p>
        </div>

        <div class="carousel-3d-viewport">
          <div class="carousel-3d-container">
            <div 
              v-for="(item, index) in gallery3DItems" 
              :key="item.id"
              class="card-3d"
              :class="getCard3DClass(index)"
              @click="setActive3DCard(index)"
            >
              <div class="card-3d-inner glass">
                <div class="card-3d-image-wrap">
                  <img :src="item.image" :alt="item.name" class="card-3d-img" />
                  <div class="card-3d-badge">{{ item.category }}</div>
                </div>
                <div class="card-3d-info">
                  <h3>{{ item.name }}</h3>
                  <p>{{ item.desc }}</p>
                  <button class="btn-3d-action" @click.stop="playArtifactSound(item)">
                    <AppIcon :name="playingArtifactId === item.id ? 'square' : 'headphones'" :size="14" />
                    <span>{{ playingArtifactId === item.id ? 'Pause' : 'Écouter l\'histoire' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Commandes de navigation -->
          <div class="carousel-3d-controls">
            <button class="ctrl-btn prev" @click="prev3DCard" aria-label="Précédent">
              <AppIcon name="chevron-left" :size="20" />
            </button>
            <button class="ctrl-btn next" @click="next3DCard" aria-label="Suivant">
              <AppIcon name="chevron-right" :size="20" />
            </button>
          </div>

          <!-- Bouton de redirection vers la Galerie 3D complète -->
          <div class="carousel-3d-explore-more" style="margin-top: 30px; text-align: center;">
            <RouterLink to="/galerie-3d" class="btn-primary-custom inline-flex align-center gap-2" style="padding: 12px 24px; text-decoration: none;">
              <AppIcon name="external-link" :size="16" />
              <span>Visiter la Galerie 3D Complète (12 œuvres)</span>
            </RouterLink>
          </div>
        </div>
      </section>

      <!-- ─── Livre d'Or Preview ─── -->
      <section class="livre-dor-preview-section" v-reveal="225">
        <div class="section-title-wrap text-center">
          <h2>Livre d'Or du Musée</h2>
          <div class="section-divider mx-auto"></div>
          <p class="section-subtitle-3d">Les impressions et témoignages des visiteurs du monde entier</p>
        </div>

        <div class="ld-static-grid">
          <div
            v-for="msg in guestbookPreview"
            :key="msg.id"
            class="ld-clean-card form-card"
          >
            <div class="ld-card-top">
              <div class="ld-quote-mark">“</div>
              <span class="ld-clean-date">{{ msg.date }}</span>
            </div>
            
            <p class="ld-clean-text">{{ msg.text }}</p>

            <div class="ld-clean-author-row">
              <GuestbookAvatar :genre="msg.genre || 'homme'" :size="36" />
              <div class="ld-clean-author-info">
                <span class="ld-clean-name">{{ msg.author }}</span>
                <span class="ld-clean-location"><AppIcon name="map-pin" :size="11" /> {{ msg.location }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="ld-preview-cta text-center mt-3">
          <RouterLink to="/livre-d-or" class="btn-primary-custom inline-flex">
            <AppIcon name="book-open" :size="16" /> Consulter le Livre d'Or &amp; Partager un témoignage
          </RouterLink>
        </div>
      </section>

      <!-- ─── Actualités & Revue de Presse ─── -->
      <section class="news-and-press-section" v-reveal="230">
        <div class="news-press-grid">
          
          <!-- MAIN : Dernières Actualités -->
          <div class="news-main-column">
            <div class="section-title-wrap text-left">
              <h2>Dernières Actualités</h2>
              <div class="section-divider"></div>
            </div>
            
            <div class="news-cards-grid mt-4">
              <div 
                v-for="news in latestNews" 
                :key="news.id" 
                class="news-card glass"
                @click="readNews(news.id)"
              >
                <div class="news-img-wrap">
                  <img :src="news.imageUrl" :alt="news.titre" class="news-card-img" loading="lazy" />
                  <div class="news-date-badge">{{ news.date_evenement ? formatShortDate(news.date_evenement) : 'À venir' }}</div>
                </div>
                <div class="news-content-wrap">
                  <h3 class="news-card-title">{{ news.titre }}</h3>
                  <p class="news-card-desc">{{ news.description }}</p>
                  <span class="news-link">
                    Lire l'article <AppIcon name="chevron-right" :size="14" />
                  </span>
                </div>
              </div>
            </div>
            
            <div class="text-left news-view-all-wrap" style="margin-top: 36px;">
              <RouterLink to="/actualites" class="btn-primary-custom inline-flex">
                <AppIcon name="file-text" :size="16" /> Voir toutes les actualités
              </RouterLink>
            </div>
          </div>

          <!-- SIDEBAR : Revue de Presse -->
          <aside class="press-sidebar-column">
            <div class="section-title-wrap text-left">
              <h2>Dans la Presse</h2>
              <div class="section-divider"></div>
            </div>
            
            <div class="press-list mt-4">
              <a 
                v-for="article in revuePresseList" 
                :key="article.id" 
                :href="article.url_lien" 
                target="_blank" 
                rel="noopener noreferrer"
                class="press-sidebar-item glass"
              >
                <div class="press-media-badge">{{ article.media_nom }}</div>
                <h4 class="press-title">{{ article.titre }}</h4>
                <div class="press-date">{{ formatShortDate(article.date_publication) }}</div>
              </a>
              <div v-if="revuePresseList.length === 0" class="empty-press">
                <AppIcon name="award" :size="24" style="opacity:0.5; margin-bottom:8px" />
                <p>Aucun article de presse pour le moment</p>
              </div>
            </div>
            
            <div class="text-left" style="margin-top: 36px;" v-if="revuePresseList.length > 0">
              <RouterLink to="/revue-presse" class="btn-sidebar-view-all inline-flex">
                <AppIcon name="external-link" :size="16" /> Voir toute la revue de presse
              </RouterLink>
            </div>
          </aside>

        </div>
      </section>

      <!-- ─── Newsletter Section ─── -->
      <section class="newsletter-section" v-reveal="240">
        <div class="newsletter-box glass">
          <div class="newsletter-icon">
            <AppIcon name="mail" :size="24" />
          </div>
          <div class="newsletter-text">
            <h3>Restez informé</h3>
            <p>Inscrivez-vous à notre newsletter pour recevoir les dernières actualités du Musée Virtuel de Guinée.</p>
          </div>
          <form class="newsletter-form" @submit.prevent="handleNewsletterSubmit">
            <div class="newsletter-input-group">
              <input 
                type="email" 
                v-model="newsletterEmail" 
                placeholder="Votre adresse e-mail" 
                required 
                :disabled="isSubmittingNewsletter"
              />
              <button type="submit" :disabled="isSubmittingNewsletter" class="btn-newsletter">
                <AppIcon v-if="isSubmittingNewsletter" name="loader" class="spin" :size="16" />
                <span v-else>S'inscrire</span>
              </button>
            </div>
            <Transition name="toast">
              <div v-if="newsletterMessage" class="newsletter-msg" :class="{ error: newsletterError }">
                <AppIcon :name="newsletterError ? 'alert-circle' : 'check-circle'" :size="18" />
                {{ newsletterMessage }}
              </div>
            </Transition>
          </form>
        </div>
      </section>

      <!-- CTA Portail Admin -->
      <section v-if="isAdminDomain" class="admin-portal-cta" v-reveal="250">
        <div class="portal-card glass text-center">
          <div class="portal-icon"><AppIcon name="lock" :size="28" /></div>
          <h2>Espace Équipe Projet</h2>
          <p>
            Vous êtes membre de l'équipe du projet ? Authentifiez-vous pour accéder à la planification d'événements, aux invitations personnalisées, au scan d'émargement et aux rapports de participation.
          </p>
          <button @click="triggerLogin" class="btn-focus-action mx-auto">
            <AppIcon name="key" :size="16" /> Accéder à l'administration
          </button>
        </div>
      </section>
    </template>

    <!-- ─── Modal Invitation Urgence ─── -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="modal-backdrop" @click.self="closeUrgentModal">
        <div class="modal-box form-card">
          <div class="fh fh-s">
            <div class="fh-icon"><AppIcon name="send" :size="22" /></div>
            <div class="fh-title">Invitation d'Urgence</div>
            <div class="fh-sub">Ajouter et inviter un contact instantanément</div>
          </div>
          <div class="fb">
            <div v-if="inviteSuccess" class="omsg on">
              <div class="oico"><AppIcon name="check-circle" :size="48" /></div>
              <h3>Invitation envoyée !</h3>
              <p>Le participant a été ajouté et son invitation e-mail a été expédiée avec succès.</p>
              <button class="breset" @click="resetUrgentForm">Inviter un autre participant</button>
            </div>

            <form v-else @submit.prevent="submitUrgentInvitation" class="ev-form">
              <!-- Choix de l'événement -->
              <div class="fg">
                <label>Événement <span class="req">*</span></label>
                <select v-model="selectedEventId" required>
                  <option value="" disabled>Sélectionnez un événement…</option>
                  <option v-for="e in api.evenements" :key="e.id" :value="e.id">
                    {{ e.titre }} ({{ formatShortDate(e.date_debut) }})
                  </option>
                </select>
              </div>

              <div class="fr">
                <div class="fg">
                  <label>Prénom <span class="req">*</span></label>
                  <input type="text" v-model="inviteForm.prenom" required placeholder="Ex : Mamadou" />
                </div>
                <div class="fg">
                  <label>Nom <span class="req">*</span></label>
                  <input type="text" v-model="inviteForm.nom" required placeholder="Ex : Diallo" />
                </div>
              </div>

              <div class="fg">
                <label>E-mail <span class="req">*</span></label>
                <input type="email" v-model="inviteForm.email" required placeholder="contact@example.com" />
              </div>

              <div class="fg">
                <label>Organisation</label>
                <input type="text" v-model="inviteForm.organisation" placeholder="Ex : Ministère de la Culture" />
              </div>

              <!-- Steps Loader -->
              <div v-if="inviting" class="inviting-steps">
                <div class="step-loader"><AppIcon name="loader" class="spin" :size="16" /> {{ invitingStep }}</div>
              </div>

              <div v-if="inviteError" class="emsg on">
                <AppIcon name="alert-triangle" :size="15" /> {{ inviteError }}
              </div>

              <div class="modal-actions mt-3">
                <button type="button" class="btn-cancel" @click="closeUrgentModal" :disabled="inviting">Annuler</button>
                <button type="submit" class="bsub bsub-s modal-submit" :disabled="inviting || !selectedEventId">
                  <AppIcon name="send" :size="16" v-if="!inviting" />
                  {{ inviting ? 'Envoi…' : 'Envoyer l\'invitation' }}
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'
import GuestbookAvatar from '../components/GuestbookAvatar.vue'

const router = useRouter()
const api = useApiStore()

const latestNews = computed(() => {
  return (api.actualites || []).slice(0, 4)
})

const revuePresseList = ref([])

const fallbackHeroSlides = [
  {
    id: 1,
    image: '/images/banner-mvg.jpeg',
    alt: 'Exposition culturelle MVG',
    preTitle: 'Écrire l’avenir',
    mainTitle: 'des événements culturels',
    subtitle: 'Une vitrine premium pour présenter vos expositions, vos actualités et les moments forts de votre institution.'
  },
  {
    id: 2,
    image: '/images/equipe-chantier-projet.jpg',
    alt: 'Équipe chantier, projet et partenaires',
    preTitle: 'Fédérer',
    mainTitle: 'les acteurs du projet',
    subtitle: 'Une synergie autour d\'une vision commune entre l\'équipe du chantier, la direction du projet et nos partenaires engagés.'
  },
  {
    id: 3,
    image: '/images/hackaton-gagnant.jpg',
    alt: 'Hackathon créatif',
    preTitle: 'Impliquer',
    mainTitle: 'les jeunes créatifs guinéens',
    subtitle: 'Retour sur le hackathon gagnant et l\'implication de la jeunesse locale pour la création de la charte graphique du projet.'
  },
  {
    id: 4,
    image: '/images/journee-internationale-musees.jpg',
    alt: 'Journée internationale des musées',
    preTitle: 'Célébrer',
    mainTitle: 'la Journée Internationale des Musées',
    subtitle: 'Un événement majeur pour mettre en lumière nos initiatives et célébrer la richesse de notre patrimoine culturel.'
  },
  {
    id: 5,
    image: '/images/signature.jpg',
    alt: 'Signature de l\'extension du musée',
    preTitle: 'Concrétiser',
    mainTitle: 'les grands partenariats',
    subtitle: 'Signature de l\'extension du musée avec les ministres du Budget et de la Culture, l\'Ambassadeur de France et le Directeur de l\'AFD.'
  },
  {
    id: 6,
    image: '/images/stand-mvg.jpeg',
    alt: 'Exposition immersive',
    preTitle: 'Accélérer',
    mainTitle: 'la visibilité de votre projet',
    subtitle: 'Ayez un socle digital prêt à évoluer, à intégrer vos futurs visuels et à séduire votre public.'
  }
]

const heroSlides = computed(() => {
  const slides = api.heroSlides && api.heroSlides.length > 0 ? api.heroSlides : fallbackHeroSlides
  return slides.slice(0, 6)
})

const currentHeroSlide = ref(0)
const activeHeroSlide = computed(() => heroSlides.value[currentHeroSlide.value] || heroSlides.value[0])
let heroInterval = null

function readNews(id) {
  router.push({ name: 'ActualiteDetail', params: { id } })
}

const isAdminDomain = computed(() => {
  const hostname = window.location.hostname
  const adminDomain = import.meta.env.VITE_ADMIN_DOMAIN || 'admin.mvg-events.com'
  const adminQueryParam = import.meta.env.VITE_ADMIN_QUERY_PARAM || 'admin'
  return hostname === adminDomain || 
         hostname.startsWith('admin.') || 
         new URLSearchParams(window.location.search).get(adminQueryParam) === 'true'
})

// State
const kpiStats = ref({
  total_evenements: 0,
  taux_presence_moyen: 0,
  formats_distribution: { presentiel: 0, virtuel: 0, hybride: 0 },
  cumul_participants: 0,
  total_abonnes: 0,
  total_campagnes: 0
})
const activities = ref([])
const loading = ref(false)
const activeEventStats = ref(null)

// Timers
let activeStatsTimer = null
let dashboardTimer = null

// Modal Urgence
const showInviteModal = ref(false)
const selectedEventId = ref('')
const inviting = ref(false)
const invitingStep = ref('')
const inviteError = ref('')
const inviteSuccess = ref(false)
const inviteForm = ref({
  prenom: '',
  nom: '',
  email: '',
  organisation: ''
})

// Newsletter
const newsletterEmail = ref('')
const isSubmittingNewsletter = ref(false)
const newsletterMessage = ref('')
const newsletterError = ref(false)

async function handleNewsletterSubmit() {
  if (!newsletterEmail.value.trim()) return
  isSubmittingNewsletter.value = true
  newsletterMessage.value = ''
  newsletterError.value = false
  try {
    await api.subscribeNewsletter(newsletterEmail.value)
    newsletterMessage.value = "Merci pour votre inscription ! Vous recevrez bientôt nos actualités."
    newsletterEmail.value = ''
  } catch (err) {
    newsletterError.value = true
    newsletterMessage.value = err.message || "Une erreur est survenue lors de l'inscription."
    } finally {
      isSubmittingNewsletter.value = false
      if (newsletterMessage.value) {
        setTimeout(() => {
          newsletterMessage.value = ''
        }, 4000)
      }
    }
}

// Trigger login event to open modal in App.vue
function triggerLogin() {
  window.dispatchEvent(new CustomEvent('open-login'))
}

function startHeroAutoplay() {
  stopHeroAutoplay()
  heroInterval = setInterval(() => {
    currentHeroSlide.value = (currentHeroSlide.value + 1) % heroSlides.value.length
  }, 6000)
}

function stopHeroAutoplay() {
  if (heroInterval) {
    clearInterval(heroInterval)
    heroInterval = null
  }
}

function goToHeroSlide(index) {
  currentHeroSlide.value = index
}

// Start/Stop monitoring based on connection
function startMonitoring() {
  stopMonitoring()
  
  if (!api.isConnected) return
  
  loading.value = true
  Promise.allSettled([
    api.fetchEvenements(),
    loadDashboardData()
  ]).then(() => {
    watchActiveEvent()
  }).finally(() => {
    loading.value = false
  })
  
  dashboardTimer = setInterval(loadDashboardData, 30000) // 30s
}

function stopMonitoring() {
  clearInterval(dashboardTimer)
  clearInterval(activeStatsTimer)
  dashboardTimer = null
  activeStatsTimer = null
}

// Watcher for connection status changes
watch(() => api.isConnected, async (newVal) => {
  if (newVal) {
    startMonitoring()
  } else {
    stopMonitoring()
    // Reset stats
    kpiStats.value = {
      total_evenements: 0,
      taux_presence_moyen: 0,
      formats_distribution: { presentiel: 0, virtuel: 0, hybride: 0 },
      cumul_participants: 0,
      total_abonnes: 0,
      total_campagnes: 0
    }
    activities.value = []
    activeEventStats.value = null
    api.fetchActualites()
    
    try {
      const data = await api.get('/api/revue-presse')
      revuePresseList.value = (data || []).slice(0, 3)
    } catch (e) {
      console.error("Erreur chargement revue de presse sur la page d'accueil:", e)
    }
    
    api.fetchHeroSlides()
  }
}, { immediate: true })

// ─── Livre d'Or Preview Logic ───
// ─── Livre d'Or Preview Logic ───
const guestbookDefaultMessages = [
  { id: 1, author: 'Mamadou Diallo', location: 'Labé, Guinée', genre: 'homme', text: 'Une fierté immense de voir nos richesses culturelles modélisées avec cette qualité. La case de Fougoumba est splendide !', date: '27 Juil. 2026' },
  { id: 2, author: 'Sarah Jenkins', location: 'Londres, UK', genre: 'femme', text: 'Stunning design! The audio guide and 3D models are world-class. It feels like visiting Conakry from home.', date: '26 Juil. 2026' },
  { id: 3, author: 'Aissata Camara', location: 'Conakry, Guinée', genre: 'femme', text: 'Le masque Nimba est impressionnant en 3D. Merci pour cette initiative de digitalisation de notre patrimoine.', date: '25 Juil. 2026' },
  { id: 4, author: 'Jean-Pierre Dubois', location: 'Paris, France', genre: 'homme', text: 'Une expérience musée immersive magnifique. La constellation de particules et le son de Kora apportent une vraie âme au site.', date: '24 Juil. 2026' },
]

const guestbookPreview = ref([])

async function loadGuestbookPreview() {
  let list = []
  try {
    const data = await api.get('/api/livre-dor')
    if (Array.isArray(data) && data.length > 0) {
      list = data
      localStorage.setItem('mvg_guestbook', JSON.stringify(data))
    } else {
      const saved = localStorage.getItem('mvg_guestbook')
      if (saved) { try { list = JSON.parse(saved) } catch(e) { list = guestbookDefaultMessages } }
      else { list = guestbookDefaultMessages }
    }
  } catch (err) {
    const saved = localStorage.getItem('mvg_guestbook')
    if (saved) { try { list = JSON.parse(saved) } catch(e) { list = guestbookDefaultMessages } }
    else { list = guestbookDefaultMessages }
  }

  guestbookPreview.value = list.slice(0, 4)
}

// Lifecycle
onMounted(() => {
  api.fetchHeroSlides()
  startHeroAutoplay()
  loadGuestbookPreview()
  if (api.isConnected) {
    startMonitoring()
  }
})

// ─── Galerie 3D du Patrimoine Logic ───
const active3DIdx = ref(0)
const playingArtifactId = ref(null)
let currentUtterance = null

const gallery3DItems = ref([
  {
    id: 'rg1991806',
    sketchfabId: 'f37ff264e47e4d218e21eb1656a6c393',
    name: 'R.G. 1991.806.MNG',
    category: 'Masques Rituels',
    image: '/images/galerie-3d/cover/R.G. 1991.806.MNG.png',
    desc: 'Masque anthropomorphe traditionnel de la Guinée Forestière sculpté à la main.',
    story: 'Ce masque anthropomorphe en bois sombre provient des collections historiques du Musée National de Guinée sous le code R.G 1991.806. Il était utilisé en Guinée Forestière au cours des rites de passage et d\'initiation des jeunes adultes, transmettant force spirituelle et autorité ancestrales.',
    freq: 220.00
  },
  {
    id: 'rg19948',
    sketchfabId: 'fdd8453ae341409a8097c0b684990923',
    name: 'R.G. 1994.8.MNG',
    category: 'Statues & Effigies',
    image: '/images/galerie-3d/cover/nimba_portée.png',
    desc: 'Statue en bois de Basse-Guinée, symbole protecteur du village et du foyer.',
    story: 'Répertoriée sous le code R.G 1994.8, cette statue anthropomorphe incarne un esprit de protection. Disposée à l\'entrée des habitations familiales en Basse-Guinée, elle chassait les forces négatives et assurait la fécondité et la prospérité.',
    freq: 246.94
  },
  {
    id: 'rg2004082',
    sketchfabId: 'e6e9ee2dcfa343e1a472e1df84934b8f',
    name: 'R.G. 2004.082.MNG',
    category: 'Objets Sacrés & Royaux',
    image: '/images/galerie-3d/rg2004082.jpg',
    desc: 'Support rituel orné destiné à recevoir des offrandes sacrées.',
    story: 'Cet objet rituel (R.G 2004.082) en bois sculpté est le témoin d\'anciennes pratiques spirituelles guinéennes. Utilisé lors des prières communautaires, il recevait les libations destinées à apaiser les ancêtres et les dieux de la nature.',
    freq: 261.63
  },
  {
    id: 'rg20040092',
    sketchfabId: '0e17527f2bc148cb8c48a7da980f9ad5',
    name: 'R.G. 2004.0092.MNG',
    category: 'Céramiques & Calebasses',
    image: '/images/galerie-3d/cover/R.G. 2004.0092.MNG.png',
    desc: 'Calebasse traditionnelle polie et gravée de motifs géométriques peuls.',
    story: 'Enregistrée sous la référence R.G 2004.0092, cette calebasse est typique du savoir-faire artisanal du Fouta Djallon. Ornée de motifs géométriques gravés au fer chaud, elle servait à conserver le lait frais ou le miel.',
    freq: 293.66
  },
  {
    id: 'fougoumba',
    sketchfabId: 'c4435b6577114ed28f19b6db75ce38cb',
    name: 'Case de Fougoumba',
    category: 'Architecture & Sites',
    image: '/images/galerie-3d/cover/Case de Fougoumba.png',
    desc: 'La case sacrée où se tenait le couronnement solennel des Almamys du Fouta.',
    story: 'La case de Fougoumba est un monument historique exceptionnel situé dans la préfecture de Dalaba. C\'est dans ce temple sacré à toit de chaume géant que s\'effectuait le rituel traditionnel de couronnement des souverains de l\'État théocratique du Fouta Djallon.',
    freq: 329.63
  },
  {
    id: 'dalaba',
    sketchfabId: 'a03dd58bbdbd4505b54c83d453fb6731',
    name: 'Habitation de Dalaba',
    category: 'Architecture & Sites',
    image: '/images/galerie-3d/cover/dalaba.png',
    desc: 'Case traditionnelle à toiture conique en paille typique de Moyenne-Guinée.',
    story: 'Cette modélisation 3D reproduit les habitations cylindriques à toit de chaume typiques de Moyenne-Guinée. Leurs structures épaisses et le chaume permettent de conserver une température agréable face aux fortes amplitudes thermiques des hauteurs du Fouta.',
    freq: 349.23
  },
  {
    id: 'rg1991394',
    sketchfabId: 'b9d3456de8cd429589c982cbe5eb3471',
    name: 'R.G. 1991.394.MNG',
    category: 'Céramiques & Calebasses',
    image: '/images/galerie-3d/cover/R.G. 1991.394.MNG.png',
    desc: 'Jarre traditionnelle en terre cuite pour la conservation de l\'eau fraîche.',
    story: 'Cette jarre en argile modelée à la main (R.G 1991.394) provient de la Haute-Guinée. Sa surface texturée et ses légers décors peints servaient à la fois d\'esthétique et d\'isolation thermique pour rafraîchir l\'eau potable du foyer.',
    freq: 392.00
  },
  {
    id: 'nimba',
    sketchfabId: '8039d20c33d04a9c8100adad66442d77',
    name: 'Le Grand Masque Nimba',
    category: 'Masques Rituels',
    image: '/images/galerie-3d/cover/nimba.png',
    desc: 'Masque d\'épaule baga monumental représentant la déesse de la maternité et de la récolte.',
    story: 'Le masque Nimba (ou D\'mba) est l\'œuvre emblématique de la Guinée maritime. Représentant l\'idéal féminin de bonté et de force chez les Baga, ce masque d\'épaule géant est porté pour célébrer le travail de la terre, les moissons et les naissances.',
    freq: 440.00
  },
  {
    id: 'atshiol',
    sketchfabId: 'ea7b4ee811614c32aab14272a55d1a0a',
    name: 'Le Masque Atshiol',
    category: 'Masques Rituels',
    image: '/images/galerie-3d/cover/asthiol.png',
    desc: 'Masque cimier traditionnel zoomorphe représentant l\'esprit suprême protecteur.',
    story: 'Le masque Atshiol (A-Tshol) est une entité spirituelle majeure chez les peuples côtiers baga. Sculpté sous une forme combinant bec d\'oiseau et tête de reptile, il veillait à la cohésion sociale et intervenait lors des décisions de justice importantes.',
    freq: 493.88
  },
  {
    id: 'nimbaporte',
    sketchfabId: '661008aadd844d689be698aaae368c78',
    name: 'Nimba Porté avec Costume',
    category: 'Masques Rituels',
    image: '/images/galerie-3d/cover/nimba_portée.png',
    desc: 'Modélisation du danseur rituel revêtu du costume intégral en fibres de raphia.',
    story: 'Cette reconstitution montre le masque Nimba en pleine action rituelle. Le porteur dissimule son corps sous une épaisse jupe de fibres végétales de raphia. Ses yeux regardent à travers des fentes taillées au niveau de la poitrine de la structure en bois.',
    freq: 523.25
  },
  {
    id: 'kouranko',
    sketchfabId: 'bd6e7d8723e345eabf1fcb6741b89906',
    name: 'Le Masque Kouranko',
    category: 'Masques Rituels',
    image: '/images/galerie-3d/cover/masque_kouranko.png',
    desc: 'Masque zoomorphe en bois noirci utilisé par les confréries de chasseurs.',
    story: 'Ce masque provient des traditions du peuple Kouranko en Haute-Guinée. Porté par les confréries de chasseurs, il facilitait la connexion spirituelle avec les forces de la nature sauvage pour bénir et protéger les expéditions de traque.',
    freq: 587.33
  },
  {
    id: 'simogui',
    sketchfabId: '29f19921327d4bef8a013cc71b7db034',
    name: 'Le Masque Simogui',
    category: 'Masques Rituels',
    image: '/images/galerie-3d/cover/simogui.png',
    desc: 'Masque serpentiforme vertical incarnant l\'esprit de l\'eau.',
    story: 'Le masque Simogui représente le python ou serpent d\'eau stylisé. Mesurant parfois près d\'un mètre prés de cinquante de hauteur, il dansait lors des cérémonies d\'initiation côtières pour attirer la bienveillance des esprits de l\'eau sur les récoltes rizicoles.',
    freq: 659.25
  }
])

function getCard3DClass(index) {
  const len = gallery3DItems.value.length
  const diff = (index - active3DIdx.value + len) % len
  if (diff === 0) return 'active'
  if (diff === 1) return 'right'
  if (diff === len - 1) return 'left'
  return 'hidden'
}

function setActive3DCard(index) {
  if (active3DIdx.value === index) {
    router.push({ name: 'Galerie3D', query: { item: gallery3DItems.value[index].id } })
  } else {
    active3DIdx.value = index
  }
}

function prev3DCard() {
  const len = gallery3DItems.value.length
  active3DIdx.value = (active3DIdx.value - 1 + len) % len
}

function next3DCard() {
  const len = gallery3DItems.value.length
  active3DIdx.value = (active3DIdx.value + 1) % len
}

let ambientAudioCtx = null
let ambientGainNode = null
let ambientOscillators = []

function stopAmbientSound() {
  if (ambientGainNode && ambientAudioCtx) {
    try {
      ambientGainNode.gain.cancelScheduledValues(ambientAudioCtx.currentTime)
      ambientGainNode.gain.setValueAtTime(ambientGainNode.gain.value, ambientAudioCtx.currentTime)
      ambientGainNode.gain.linearRampToValueAtTime(0, ambientAudioCtx.currentTime + 1.5)
      
      ambientOscillators.forEach(osc => {
        try { osc.stop(ambientAudioCtx.currentTime + 1.6) } catch (e) {}
      })
      ambientOscillators = []
    } catch (e) {
      console.error(e)
    }
  }
}

function startAmbientSound(baseFreq) {
  try {
    if (!ambientAudioCtx) {
      ambientAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ambientAudioCtx.state === 'suspended') {
      ambientAudioCtx.resume()
    }

    stopAmbientSound()

    ambientGainNode = ambientAudioCtx.createGain()
    ambientGainNode.connect(ambientAudioCtx.destination)
    
    ambientGainNode.gain.setValueAtTime(0, ambientAudioCtx.currentTime)
    ambientGainNode.gain.linearRampToValueAtTime(0.12, ambientAudioCtx.currentTime + 2)

    // Drone 1 (Root note)
    const osc1 = ambientAudioCtx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(baseFreq / 2, ambientAudioCtx.currentTime)
    osc1.connect(ambientGainNode)
    osc1.start()
    ambientOscillators.push(osc1)

    // Drone 2 (Fifth)
    const osc2 = ambientAudioCtx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime((baseFreq / 2) * 1.5, ambientAudioCtx.currentTime)
    const osc2Gain = ambientAudioCtx.createGain()
    osc2Gain.gain.setValueAtTime(0.04, ambientAudioCtx.currentTime)
    
    const lfo = ambientAudioCtx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(0.15, ambientAudioCtx.currentTime) 
    const lfoGain = ambientAudioCtx.createGain()
    lfoGain.gain.setValueAtTime(0.02, ambientAudioCtx.currentTime)
    lfo.connect(lfoGain)
    lfoGain.connect(osc2Gain.gain)
    lfo.start()
    ambientOscillators.push(lfo)

    osc2.connect(osc2Gain)
    osc2Gain.connect(ambientGainNode)
    osc2.start()
    ambientOscillators.push(osc2)

    // Initial Pluck
    const pluck = ambientAudioCtx.createOscillator()
    const pluckGain = ambientAudioCtx.createGain()
    const pluckFilter = ambientAudioCtx.createBiquadFilter()

    pluck.type = 'sine'
    pluck.frequency.setValueAtTime(baseFreq, ambientAudioCtx.currentTime)
    
    pluckGain.gain.setValueAtTime(0.5, ambientAudioCtx.currentTime)
    pluckGain.gain.exponentialRampToValueAtTime(0.001, ambientAudioCtx.currentTime + 3)

    pluckFilter.type = 'bandpass'
    pluckFilter.frequency.setValueAtTime(baseFreq * 2, ambientAudioCtx.currentTime)
    
    pluck.connect(pluckFilter)
    pluckFilter.connect(pluckGain)
    pluckGain.connect(ambientGainNode)
    
    pluck.start()
    pluck.stop(ambientAudioCtx.currentTime + 3.5)
    
  } catch (e) {
    console.error("Audio Context error:", e)
  }
}

function playArtifactSound(item) {
  if (playingArtifactId.value === item.id) {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    stopAmbientSound()
    playingArtifactId.value = null
    return
  }

  if (window.speechSynthesis) window.speechSynthesis.cancel()
  stopAmbientSound()
  playingArtifactId.value = item.id

  startAmbientSound(item.freq)

  if (window.speechSynthesis) {
    currentUtterance = new SpeechSynthesisUtterance(item.story)
    currentUtterance.lang = 'fr-FR'
    currentUtterance.rate = 1.0
    currentUtterance.pitch = 0.95

    currentUtterance.onend = () => {
      stopAmbientSound()
      playingArtifactId.value = null
    }
    currentUtterance.onerror = () => {
      stopAmbientSound()
      playingArtifactId.value = null
    }

    window.speechSynthesis.speak(currentUtterance)
  } else {
    setTimeout(() => {
      stopAmbientSound()
      playingArtifactId.value = null
    }, 5000)
  }
}

onUnmounted(() => {
  stopHeroAutoplay()
  stopMonitoring()
  stopAmbientSound()
  if (window.speechSynthesis) window.speechSynthesis.cancel()
})

// Load KPI & Activities
async function loadDashboardData() {
  try {
    const [stats, acts] = await Promise.allSettled([
      api.fetchDashboardStats(),
      api.fetchDashboardActivities()
    ])
    if (stats.status === 'fulfilled') {
      kpiStats.value = stats.value
    }
    if (acts.status === 'fulfilled') {
      activities.value = acts.value
    }
  } catch (err) {
    console.error('Erreur chargement dashboard:', err)
  }
}

// Format Distribution percent
function formatPercent(format) {
  const sum = kpiStats.value.total_evenements || 0
  if (!sum) return 0
  const count = kpiStats.value.formats_distribution[format] || 0
  return Math.round((count / sum) * 100)
}

// Active Event detect
const activeEvent = computed(() => {
  if (!api.evenements.length) return null
  
  const isToday = (dateStr) => {
    if (!dateStr) return false
    const d = new Date(dateStr)
    const today = new Date()
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear()
  }

  return api.evenements.find(e => {
    const start = new Date(e.date_debut)
    const end = e.date_fin ? new Date(e.date_fin) : new Date(start.getTime() + 4 * 60 * 60 * 1000)
    const now = new Date()
    return (now >= start && now <= end) || isToday(e.date_debut)
  }) || null
})

// Upcoming Event detect
const nextEvent = computed(() => {
  if (!api.evenements.length) return null
  const now = new Date()
  const upcoming = api.evenements
    .filter(e => (e.statut === 'a_venir' || (e.date_debut && new Date(e.date_debut) > now)) && e.id !== activeEvent.value?.id)
    .sort((a, b) => {
      const dateA = a.date_debut ? new Date(a.date_debut) : new Date(8640000000000000);
      const dateB = b.date_debut ? new Date(b.date_debut) : new Date(8640000000000000);
      return dateA - dateB;
    })
  return upcoming[0] || null
})

// Last Event detect for CSV report
const lastEvent = computed(() => {
  if (!api.evenements.length) return null
  // The first event in the API list is the most recent (sorted by date_debut desc)
  return api.evenements[0]
})

// Real-time stats for active event
const activeStats = computed(() => {
  if (!activeEventStats.value) {
    return { present: 0, confirmed: 0, percent: 0 }
  }
  const s = activeEventStats.value.par_statut || {}
  const present = s.present || 0
  const confirmed = (s.inscrit || 0) + present
  const percent = confirmed > 0 ? Math.round((present / confirmed) * 100) : 0
  return { present, confirmed, percent }
})

// Watch active event
function watchActiveEvent() {
  clearInterval(activeStatsTimer)
  if (activeEvent.value) {
    loadActiveStats()
    activeStatsTimer = setInterval(loadActiveStats, 15000) // refresh active stats every 15s
  }
}

async function loadActiveStats() {
  if (!activeEvent.value) return
  try {
    const res = await api.get(`/api/evenements/${activeEvent.value.id}/stats`)
    activeEventStats.value = res
  } catch (err) {
    console.error('Erreur stats événement actif:', err)
  }
}

// Upcoming events list for calendar
const upcomingList = computed(() => {
  const now = new Date()
  return api.evenements
    .filter(e => e.statut === 'a_venir' || (e.date_debut && new Date(e.date_debut) > now) && e.id !== activeEvent.value?.id)
    .sort((a, b) => {
      const dateA = a.date_debut ? new Date(a.date_debut) : new Date(0); // 0 puts it at the beginning of ascending sort
      const dateB = b.date_debut ? new Date(b.date_debut) : new Date(0);
      return dateA - dateB;
    })
})

// Navigation
function goToScan(eventId) {
  router.push({ name: 'Checkin', params: { eventId } })
}

function goToInvitations(eventId) {
  router.push({ name: 'Invitations', params: { eventId } })
}

function openCreateEvent() {
  router.push({ name: 'Evenements', query: { create: 'true' } })
}

function goToManageActualites() {
  router.push({ name: 'ManageActualites' })
}

// Quick Actions: Export CSV
async function exportLastEventCSV() {
  if (!lastEvent.value) return
  const evt = lastEvent.value
  try {
    // Fetch invitations for the last event
    const invitations = await api.get(`/api/invitations?evenement_id=${evt.id}`)
    
    // Create CSV content
    const csvRows = [
      ['Prenom', 'Nom', 'Email', 'Organisation', 'Statut RSVP', 'Date d\'envoi', 'Date de reponse', 'Heure d\'arrivee'],
      ...invitations.map(inv => [
        inv.invite?.prenom || '',
        inv.invite?.nom || '',
        inv.invite?.email || '',
        inv.invite?.organisation || '',
        statutTextFrench(inv.statut),
        inv.date_envoi ? new Date(inv.date_envoi).toLocaleString('fr-FR') : '',
        inv.date_reponse ? new Date(inv.date_reponse).toLocaleString('fr-FR') : '',
        inv.heure_arrivee ? new Date(inv.heure_arrivee).toLocaleString('fr-FR') : ''
      ])
    ]

    const csvContent = "\uFEFF" + csvRows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `rapport_${evt.titre.replace(/\s+/g, '_')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error('Erreur lors de l\'export CSV:', err)
    alert('Une erreur est survenue lors de la génération du rapport CSV.')
  }
}

// Modal Urgence Handlers
function openUrgentModal() {
  selectedEventId.value = activeEvent.value?.id || nextEvent.value?.id || ''
  inviteError.value = ''
  inviteSuccess.value = false
  inviteForm.value = { prenom: '', nom: '', email: '', organisation: '' }
  showInviteModal.value = true
}

function closeUrgentModal() {
  showInviteModal.value = false
}

function resetUrgentForm() {
  inviteSuccess.value = false
  inviteError.value = ''
  inviteForm.value = { prenom: '', nom: '', email: '', organisation: '' }
}

async function submitUrgentInvitation() {
  if (!selectedEventId.value) return
  inviting.value = true
  inviteError.value = ''
  
  try {
    // Step 1: Create the invite contact
    invitingStep.value = '1. Enregistrement du contact…'
    const contact = await api.post('/api/invites', {
      prenom: inviteForm.value.prenom.trim(),
      nom: inviteForm.value.nom.trim(),
      email: inviteForm.value.email.trim(),
      organisation: inviteForm.value.organisation.trim(),
      notes: 'Ajouté en urgence depuis le tableau de bord.'
    })

    // Step 2: Create the invitation
    invitingStep.value = '2. Liaison à l\'événement…'
    const resInv = await api.post('/api/invitations', {
      evenement_id: selectedEventId.value,
      invite_ids: [contact.id]
    })
    const invitation = resInv.invitations[0]

    // Step 3: Send the email
    invitingStep.value = '3. Envoi de l\'e-mail d\'invitation…'
    await api.post('/api/invitations/send', {
      invitation_ids: [invitation.id]
    })

    // Success
    inviteSuccess.value = true
    
    // Refresh dashboard data and events
    await api.fetchEvenements()
    await loadDashboardData()
    if (activeEvent.value && activeEvent.value.id === selectedEventId.value) {
      await loadActiveStats()
    }
  } catch (err) {
    inviteError.value = err.message || 'Une erreur est survenue.'
  } finally {
    inviting.value = false
  }
}

// Text Translators
function formatLabel(format) {
  const map = { presentiel: 'Présentiel', virtuel: 'Virtuel', hybride: 'Hybride' }
  return map[format] || 'Présentiel'
}

function statutTextFrench(s) {
  const map = { pas_de_reaction: 'Pas de réaction', inscrit: 'Inscrit', decline: 'Décliné', present: 'Présent' }
  return map[s] || s
}

// Date Format Helpers
function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr))
  } catch { return dateStr }
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date(dateStr))
  } catch { return dateStr }
}

function formatTimeRange(evt) {
  if (!evt.date_debut) return ''
  try {
    const start = new Date(evt.date_debut)
    const timeStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const dateStr = start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
    return `${dateStr} à ${timeStr}`
  } catch {
    return evt.date_debut
  }
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    const diffMs = new Date() - new Date(dateStr)
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Hier'
    return `Il y a ${diffDays} jours`
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
.home-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 40px;
}

/* ─── Hero Section ─── */
.hero-section {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  height: calc(100vh - 120px);
  min-height: 550px;
  max-height: 850px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 15px 35px rgba(89,55,22,0.15);
  margin-top: 10px;
  padding: 60px 60px;
  background: #000;
  user-select: none;
  -webkit-user-select: none;
  caret-color: transparent;
}
.hero-bg {
  position: absolute; inset: 0; z-index: 1;
}
.hero-slide {
  position: absolute; 
  top: -2%; left: -2%; width: 104%; height: 104%;
  animation: heroPulse 9s ease-in-out infinite;
  /* Prevent caret blinking just in case */
  caret-color: transparent;
}
.hero-img {
  width: 100%; height: 100%; object-fit: cover;
  object-position: center 15%;
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.3) 40%, transparent 80%);
}
.hero-content {
  position: relative; z-index: 2;
  text-align: left; color: #fff;
  max-width: 700px;
  width: 100%;
  animation: fadeInUp 0.6s ease-out;
}
.hero-text-wrapper {
  position: relative;
  min-height: 250px;
  width: 100%;
}
.hero-copy-shell {
  position: absolute;
  bottom: 0; left: 0;
  width: 100%;
}
.hero-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  padding: 5px 14px; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; margin-bottom: 12px;
  transform: translateY(-30px);
}
.hero-title {
  font-size: 2.4rem; font-weight: 900; line-height: 1.15;
  margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.2px;
}
.text-light { font-weight: 300; font-size: 1.4rem; opacity: 0.9; text-transform: none; letter-spacing: 0; }
.text-gold { color: var(--gold); }
.hero-subtitle {
  font-size: 1.1rem; line-height: 1.5; opacity: 0.95;
  margin: 0; max-width: 580px; font-family: Arial, sans-serif;
}
.hero-ctas {
  display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px;
}
.hero-ctas-bottom {
  position: absolute;
  bottom: 40px;
  right: 60px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  z-index: 10;
  justify-content: flex-end;
}
.hero-dots {
  display: flex; gap: 10px; margin-top: 22px;
}
.hero-dot {
  width: 11px; height: 11px; border: 0; border-radius: 999px;
  background: rgba(255,255,255,0.45); cursor: pointer; padding: 0;
  transition: transform .25s ease, background .25s ease;
}
.hero-dot.active {
  transform: scale(1.25);
  background: var(--gold);
}

/* Image Fade Transition */
.hero-fade-enter-active,
.hero-fade-leave-active {
  transition: opacity .55s ease, transform .55s ease;
}
.hero-fade-enter-from,
.hero-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.hero-fade-enter-to,
.hero-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Split Text Transition */
.text-fade-enter-active,
.text-fade-leave-active {
  transition: opacity 0.6s ease;
}
.text-fade-enter-from,
.text-fade-leave-to {
  opacity: 0;
}

/* Text children transform transitions */
.text-fade-enter-active .hero-title,
.text-fade-leave-active .hero-title,
.text-fade-enter-active .hero-subtitle,
.text-fade-leave-active .hero-subtitle {
  transition: transform 0.6s cubic-bezier(0.33, 1, 0.68, 1);
}

.text-fade-enter-from .hero-title,
.text-fade-leave-to .hero-title {
  transform: translateX(40px);
}

.text-fade-enter-from .hero-subtitle,
.text-fade-leave-to .hero-subtitle {
  transform: translateX(-40px);
}


.btn-primary-custom,
.btn-secondary-custom,
.btn-focus-action,
.btn-sidebar-action,
.news-card,
.kpi-card,
.format-card,
.v-obj-item,
.event-strip-card,
.portal-card,
.form-card {
  transition: transform .24s ease, box-shadow .24s ease, border-color .24s ease;
}
.btn-primary-custom:hover,
.btn-secondary-custom:hover,
.btn-focus-action:hover,
.btn-sidebar-action:hover,
.news-card:hover,
.kpi-card:hover,
.format-card:hover,
.v-obj-item:hover,
.event-strip-card:hover,
.portal-card:hover,
.form-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(89,55,22,0.12);
}

@keyframes heroPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Titles */
.section-title-wrap {
  margin-bottom: 20px;
}
.section-title-wrap h2 {
  font-size: 1.35rem; font-weight: 900; color: var(--brun);
  text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;
}
.section-divider {
  width: 45px; height: 4px; background: var(--rouge);
  border-radius: 2px;
}

/* ─── KPI Cards ─── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 18px;
}
.kpi-card {
  border-radius: 20px;
  padding: 22px;
  box-shadow: 0 10px 28px rgba(89,55,22,0.06);
  border: 1px solid rgba(132,89,54,0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 135px;
}
.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(89,55,22,0.12);
  border-color: rgba(132,89,54,0.25);
}
.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.kpi-title {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--brun);
  opacity: 0.8;
}
.kpi-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-icon-wrap.or { background: rgba(132,89,54,0.1); color: var(--or); }
.kpi-icon-wrap.vert { background: rgba(46,125,50,0.1); color: #2e7d32; }
.kpi-icon-wrap.bleu { background: rgba(21,101,192,0.1); color: #1565c0; }
.kpi-icon-wrap.rouge { background: rgba(177,34,42,0.1); color: var(--rouge); }

.kpi-value-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.kpi-value {
  font-size: 1.85rem;
  font-weight: 900;
  color: var(--brun);
  line-height: 1.1;
}
.kpi-sub {
  font-size: 0.74rem;
  color: #666;
  font-weight: 600;
}

/* KPI Progress Bars */
.kpi-progress {
  height: 6px;
  background: rgba(0,0,0,0.06);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;
  margin-bottom: 2px;
}
.kpi-progress-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.8s ease;
}
.bg-vert { background: linear-gradient(90deg, #4caf50, #2e7d32); }

.format-ratios {
  display: flex;
  gap: 12px;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--brun);
  margin-bottom: 4px;
}
.ratio-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.dot {
  width: 8px; height: 8px; border-radius: 50%; display: inline-block;
}
.dot.green { background: #2e7d32; }
.dot.blue { background: #1565c0; }
.dot.purple { background: #7b1fa2; }

.kpi-format-bar {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: rgba(0,0,0,0.06);
  margin-top: 2px;
  margin-bottom: 4px;
}
.kpi-format-bar .segment {
  height: 100%;
  transition: width 0.6s ease;
}
.kpi-format-bar .segment.green { background: #2e7d32; }
.kpi-format-bar .segment.blue { background: #1565c0; }
.kpi-format-bar .segment.purple { background: #7b1fa2; }

/* Glassmorphism style */
.glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

/* ─── Focus Box Section ─── */
.focus-box {
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(89,55,22,0.1);
  transition: all 0.3s ease;
}
.focus-box.active-mode {
  border: 1.5px solid rgba(46,125,50,0.25);
  box-shadow: 0 15px 40px rgba(46,125,50,0.12);
}
.focus-box.upcoming-mode {
  border: 1.5px solid rgba(132,89,54,0.15);
}
.focus-title {
  margin: 8px 0 12px;
  font-size: 1.6rem;
  font-weight: 900;
  color: #fff;
  line-height: 1.25;
}
.focus-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #fff;
}
.focus-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.focus-meta .meta-item { display: flex; align-items: center; gap: 6px; }

/* ─── Newsletter Section ─── */
.newsletter-section {
  max-width: 1120px; margin: 40px auto; width: 100%;
}
.newsletter-box {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px;
  background: rgba(255,255,255,0.8); border: 1px solid rgba(132, 89, 54, 0.15);
  border-radius: var(--radius); padding: 30px 40px;
  box-shadow: 0 10px 30px rgba(89, 55, 22, 0.05);
}
.newsletter-icon {
  width: 50px; height: 50px; background: linear-gradient(135deg, var(--brun), var(--or));
  color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 15px rgba(89, 55, 22, 0.2); flex-shrink: 0;
}
.newsletter-input-group { display: flex; gap: 8px; width: 100%; max-width: 480px; position: relative; }
.newsletter-input-group input { flex-grow: 1; padding: 12px 18px; border-radius: 999px; border: 2px solid rgba(132,89,54,0.15); font-family: 'Lato', sans-serif; font-size: 0.95rem; outline: none; transition: all 0.2s; background: rgba(255,255,255,0.8); }
.newsletter-input-group input:focus { border-color: rgba(249,178,51,0.6); background: #ffffff; box-shadow: 0 0 0 4px rgba(249,178,51,0.1); }
.btn-newsletter { padding: 12px 24px; background: var(--brun); color: #fff; border: none; border-radius: 999px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-newsletter:hover:not(:disabled) { background: var(--brun-fonce); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(89,55,22,0.2); }
.btn-newsletter:disabled { opacity: 0.7; cursor: not-allowed; }

/* News & Press Section */
.news-and-press-section {
  padding: 40px 0;
}
.news-press-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 40px;
  align-items: start;
}
.text-left {
  text-align: left !important;
}

/* Sidebar Revue de Presse */
.press-sidebar-column {
  background: var(--creme);
  padding: 30px 24px;
  border-radius: var(--radius);
  border: 1px solid rgba(132, 89, 54, 0.15);
  box-shadow: 0 10px 30px rgba(89, 55, 22, 0.05);
}
.press-sidebar-column .section-title-wrap h2 {
  font-size: 1.5rem;
}
.press-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.press-sidebar-item {
  display: block;
  padding: 20px 16px;
  border-radius: 12px;
  background: var(--blanc);
  border: 1px solid rgba(132, 89, 54, 0.08);
  border-left: 4px solid var(--or);
  text-decoration: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.press-sidebar-item:hover {
  transform: translateX(4px);
  border-left-color: var(--rouge);
  box-shadow: 0 8px 24px rgba(89, 55, 22, 0.08);
}
.press-media-badge {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
}
.press-title {
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--noir);
  margin: 0 0 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.press-date {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(132,89,54,0.6);
  display: flex;
  align-items: center;
  gap: 6px;
}
.press-date::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--rouge);
  border-radius: 50%;
  opacity: 0.5;
}
.empty-press {
  padding: 30px 20px;
  text-align: center;
  border: 1px dashed rgba(132,89,54,0.2);
  border-radius: var(--radius);
  color: rgba(132,89,54,0.6);
  font-size: 0.85rem;
}

.btn-sidebar-view-all {
  width: 100%;
  justify-content: center;
  background: rgba(132, 89, 54, 0.08);
  color: var(--brun-fonce);
  border: 1px solid rgba(132, 89, 54, 0.2);
  padding: 14px 24px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.9rem;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-sidebar-view-all:hover {
  background: var(--brun);
  color: var(--blanc);
  border-color: var(--brun);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(89, 55, 22, 0.2);
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.newsletter-msg {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  color: #2e7d32;
  padding: 16px 24px;
  z-index: 10000;
  border-left: 4px solid #2e7d32;
}
.newsletter-msg.error {
  color: var(--rouge);
  border-left-color: var(--rouge);
}

@media (max-width: 1024px) {
  .news-press-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .newsletter-box { flex-direction: column; text-align: center; padding: 30px 20px; }
  .newsletter-text { text-align: center; }
  .newsletter-input-group { flex-direction: column; }
  .btn-newsletter { padding: 14px; width: 100%; }
  .newsletter-msg { right: 20px; left: 20px; bottom: 20px; justify-content: center; }
  .news-press-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

.focus-meta .meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.9);
  font-size: 0.82rem;
  font-weight: 700;
}
.format-pill {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  background: rgba(255,255,255,0.25);
  border: 1px solid rgba(255,255,255,0.2);
}
.format-pill.presentiel { color: #fff; background: rgba(46, 125, 50, 0.4); border-color: rgba(46, 125, 50, 0.4); }
.format-pill.virtuel { color: #fff; background: rgba(21, 101, 192, 0.4); border-color: rgba(21, 101, 192, 0.4); }
.format-pill.hybride { color: #fff; background: rgba(123, 31, 162, 0.4); border-color: rgba(123, 31, 162, 0.4); }

.focus-body {
  background: rgba(255,255,255,0.95);
}

/* Fill gauge for J-Jour */
.gauge-container {
  margin-bottom: 22px;
}
.gauge-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: var(--brun);
  margin-bottom: 8px;
}
.gauge-label strong {
  font-size: 1.2rem;
  color: var(--rouge);
}
.gauge-label.emarges strong {
  color: #2e7d32;
}
.gauge-bar {
  height: 24px;
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid rgba(132,89,54,0.1);
}
.gauge-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold), #4caf50);
  border-radius: 999px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.gauge-pct {
  position: absolute;
  right: 16px;
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--brun);
}

.focus-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.btn-focus-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.25s;
  border: 2px solid transparent;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff;
  box-shadow: 0 4px 14px rgba(89,55,22,0.18);
}
.btn-focus-action:hover {
  transform: translateY(-2px);
  filter: brightness(1.06);
  box-shadow: 0 6px 18px rgba(89,55,22,0.25);
}
.btn-focus-action.secondary {
  background: none;
  border: 2px solid rgba(132,89,54,0.25);
  color: var(--brun);
  box-shadow: none;
}
.btn-focus-action.secondary:hover {
  background: rgba(132,89,54,0.06);
  border-color: var(--brun);
}
.btn-focus-action.active-btn {
  background: linear-gradient(135deg, #1b5e20, #2e7d32);
  box-shadow: 0 4px 14px rgba(46,125,50,0.3);
}
.btn-focus-action.active-btn:hover {
  box-shadow: 0 6px 18px rgba(46,125,50,0.45);
}

.upcoming-desc {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #555;
  margin: 0 0 20px;
}

/* Pulse animation */
.pulse::before {
  content: '';
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #4caf50;
  margin-right: 6px;
  animation: pulse-dot 1.5s infinite;
}
@keyframes pulse-dot {
  0% { transform: scale(0.9); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.5; }
  100% { transform: scale(0.9); opacity: 1; }
}

/* ─── Grid double colonnes ─── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}
@media (max-width: 800px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Calendar Card strip list */
.events-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.event-strip-card {
  background: rgba(255,255,255,0.88);
  border: 1px solid rgba(132,89,54,0.12);
  border-radius: 16px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 10px rgba(89,55,22,0.02);
}
.event-strip-card:hover {
  transform: translateX(4px);
  border-color: var(--or);
  background: #fff;
  box-shadow: 0 8px 20px rgba(89,55,22,0.08);
}
.evt-strip-format {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.format-dot-badge {
  width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.format-dot-badge.presentiel { background: #2e7d32; }
.format-dot-badge.virtuel { background: #1565c0; }
.format-dot-badge.hybride { background: #7b1fa2; }

.evt-strip-info {
  flex: 1;
}
.evt-strip-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--noir);
}
.evt-strip-meta {
  display: flex;
  gap: 12px;
  font-size: 0.76rem;
  color: #777;
}
.evt-strip-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.evt-strip-stats {
  display: flex;
  gap: 8px;
}
.stat-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(132,89,54,0.06);
  color: var(--brun);
  border: 1px solid rgba(132,89,54,0.1);
}
.stat-pill.green {
  background: rgba(46,125,50,0.06);
  color: #2e7d32;
  border-color: rgba(46,125,50,0.1);
}

.evt-strip-arrow {
  color: var(--brun);
  opacity: 0.35;
  transition: transform 0.25s;
}
.event-strip-card:hover .evt-strip-arrow {
  opacity: 0.8;
  transform: translateX(2px);
}

.empty-list-state, .empty-activities {
  text-align: center;
  padding: 30px 10px;
  color: #888;
  font-size: 0.9rem;
  background: rgba(255,255,255,0.4);
  border: 1.5px dashed rgba(132,89,54,0.15);
  border-radius: 16px;
}

/* Sidebar block elements */
.sidebar-block {
  overflow: hidden;
}
.font-sm {
  font-size: 1.05rem;
}
.flex-col { display: flex; flex-direction: column; }
.gap-2 { gap: 10px; }
.py-3 { padding-top: 14px !important; padding-bottom: 14px !important; }
.py-4 { padding-top: 24px !important; padding-bottom: 24px !important; }
.p-0 { padding: 0 !important; }
.mb-2 { margin-bottom: 8px; }
.mb-4 { margin-bottom: 20px; }
.mt-2 { margin-top: 8px; }
.mt-3 { margin-top: 14px; }
.text-center { text-align: center; }
.opacity-50 { opacity: 0.5; }
.opacity-60 { opacity: 0.6; }
.inline-flex { display: inline-flex; }

/* Sidebar Quick Action Button */
.btn-sidebar-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255,255,255,0.7);
  border: 1px solid rgba(132,89,54,0.12);
  border-radius: 12px;
  width: 100%;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s ease;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brun);
}
.btn-sidebar-action:hover:not(:disabled) {
  background: #fff;
  border-color: var(--or);
  transform: translateX(3px);
  box-shadow: 0 4px 12px rgba(89,55,22,0.06);
}
.btn-sidebar-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.action-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-icon.or { background: rgba(132,89,54,0.1); color: var(--or); }
.action-icon.rouge { background: rgba(177,34,42,0.1); color: var(--rouge); }
.action-icon.jaune { background: rgba(249,178,51,0.12); color: #8a6600; }

/* Recent Activity Feed */
.activity-feed {
  padding: 10px 18px 18px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.activity-item {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(132,89,54,0.06);
  position: relative;
}
.activity-item:last-child {
  border-bottom: none;
}
.activity-icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 2;
  box-shadow: 0 2px 5px rgba(0,0,0,0.06);
}
.activity-icon-wrap.checkin { background: #e8f5e9; color: #2e7d32; border: 1.5px solid rgba(46,125,50,0.15); }
.activity-icon-wrap.event_create { background: #e3f2fd; color: #1565c0; border: 1.5px solid rgba(21,101,192,0.15); }
.activity-icon-wrap.invite_create { background: #fff8e1; color: #f57f17; border: 1.5px solid rgba(249,178,51,0.25); }
.activity-icon-wrap.audit { background: #f3e5f5; color: #7b1fa2; border: 1.5px solid rgba(123,31,162,0.15); }

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.activity-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: var(--noir);
  font-weight: 600;
}
.activity-time {
  font-size: 0.7rem;
  color: #888;
  font-weight: 600;
}

/* ─── Modal styling and animations ─── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,16,8,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: fadeIn .2s ease;
  backdrop-filter: blur(2px);
}
.modal-box {
  width: 100%; max-width: 540px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  animation: modalIn .3s cubic-bezier(.34,1.56,.64,1);
}
.modal-actions {
  display: flex; gap: 12px; justify-content: flex-end;
}
.btn-cancel {
  padding: 12px 22px; background: none;
  border: 2px solid rgba(132,89,54,.2); border-radius: 12px;
  color: var(--brun); font-size: .88rem; font-weight: 700; cursor: pointer;
  transition: all .2s;
}
.btn-cancel:hover:not(:disabled) { border-color: var(--brun); background: rgba(132,89,54,.06); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.modal-submit { width: auto; padding: 12px 28px; margin-top: 0; }

/* Invitation steps loader inside modal */
.inviting-steps {
  background: rgba(249,178,51,0.08);
  border: 1px solid rgba(249,178,51,0.2);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 14px;
}
.step-loader {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #8a6600;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes modalIn {
  from { opacity: 0; transform: scale(.92) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

@media (max-width: 600px) {
  .hero-section {
    padding: 30px 20px;
    justify-content: flex-start;
    min-height: 320px;
  }
  .hero-content {
    text-align: left;
  }
  .hero-subtitle {
    margin: 0;
  }
  .hero-title { font-size: 1.8rem; }
  .text-light { font-size: 1.2rem; }
  .focus-title { font-size: 1.25rem; }
  .kpi-grid { grid-template-columns: 1fr; }
  .visitor-objectives-grid { grid-template-columns: 1fr; }
  .newsletter-input-group { flex-direction: column; max-width: 100%; }
  .btn-newsletter { width: 100%; text-align: center; justify-content: center; }
  .modal-actions { flex-direction: column-reverse; }
  .btn-cancel, .modal-submit { width: 100%; text-align: center; justify-content: center; }
}

/* ─── Visitor landing page styles ─── */
.visitor-intro-section {
  margin-top: 10px;
}
.visitor-objectives-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 32px;
  border-top: 1px solid rgba(132, 89, 54, 0.12);
  padding-top: 28px;
}
.v-obj-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}
.v-obj-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(132, 89, 54, 0.08);
  color: var(--or);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(89, 55, 22, 0.05);
}
.v-obj-item h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--brun);
}
.v-obj-item p {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #666;
}

.formats-section {
  margin-top: 12px;
}
.formats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}
.format-card {
  border-radius: 20px;
  padding: 28px;
  border: 1px solid rgba(132, 89, 54, 0.12);
  box-shadow: 0 10px 28px rgba(89, 55, 22, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.format-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(89, 55, 22, 0.12);
  border-color: rgba(132, 89, 54, 0.25);
}
.format-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.format-icon.theme-or { background: rgba(132, 89, 54, 0.08); color: var(--or); }
.format-icon.theme-bleu { background: rgba(21, 101, 192, 0.08); color: #1565c0; }
.format-icon.theme-rouge { background: rgba(177, 34, 42, 0.08); color: var(--rouge); }

.format-card h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--brun);
}
.format-card p {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #555;
  flex: 1;
}
.format-link {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--rouge);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.2s;
}
.format-link:hover {
  transform: translateX(4px);
}

.visitor-showcase-section {
  margin-top: 12px;
}
.showcase-card {
  box-shadow: var(--shadow);
  border: 1px solid rgba(132, 89, 54, 0.15);
}
.showcase-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
}
.showcase-info {
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}
.focus-pre {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--rouge);
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
.news-view-all-wrap {
  margin-top: 24px;
  padding-top: 8px;
}
.showcase-image-wrap {
  position: relative;
  min-height: 300px;
}
.showcase-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.admin-portal-cta {
  margin-top: 12px;
}
.portal-card {
  padding: 44px;
  border-radius: var(--radius);
  border: 1px solid rgba(132, 89, 54, 0.15);
  box-shadow: 0 12px 36px rgba(89, 55, 22, 0.08);
  max-width: 760px;
  margin: 0 auto;
}
.portal-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(132, 89, 54, 0.08);
  color: var(--or);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 18px;
}
.portal-card h2 {
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 12px;
}
.portal-card p {
  font-size: 0.88rem;
  line-height: 1.6;
  color: #666;
  max-width: 580px;
  margin: 0 auto 24px;
}
.mx-auto { margin-left: auto; margin-right: auto; }

/* Custom Buttons for Hero Section */
.hero-ctas {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}
.btn-primary-custom {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.25s;
  box-shadow: 0 6px 20px rgba(89, 55, 22, 0.25);
}
.btn-primary-custom:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
  box-shadow: 0 10px 24px rgba(89, 55, 22, 0.35);
}
.btn-secondary-custom {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  backdrop-filter: blur(4px);
}
.btn-secondary-custom:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* ─── News Cards Section ─── */
.news-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}
.news-card {
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid rgba(132, 89, 54, 0.12);
  box-shadow: 0 10px 28px rgba(89, 55, 22, 0.05);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}
.news-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(89, 55, 22, 0.12);
  border-color: rgba(132, 89, 54, 0.25);
}
.news-img-wrap {
  position: relative;
  height: 200px;
  width: 100%;
  overflow: hidden;
}
.news-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.news-card:hover .news-card-img {
  transform: scale(1.05);
}
.news-date-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(26, 16, 8, 0.85);
  color: var(--gold);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(249, 178, 51, 0.25);
}
.news-content-wrap {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.news-card-title {
  margin: 0 0 10px;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--brun);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-card-desc {
  margin: 0 0 18px;
  font-size: 0.84rem;
  line-height: 1.5;
  color: #555;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-link {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--rouge);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s;
  margin-top: auto;
}
.news-card:hover .news-link {
  transform: translateX(4px);
}

/* Responsive fixes for new elements */
@media (max-width: 768px) {
  /* Hero Section Responsive */
  /* Hero Section Responsive */
  .hero-section {
    padding: 30px 20px;
    height: 50vh;
    min-height: 380px;
    max-height: 460px;
    border-radius: 0;
    margin-left: -20px;
    width: calc(100% + 40px);
    margin-top: -10px;
    display: flex;
    align-items: flex-end;
  }
  .hero-img {
    object-position: center center;
  }
  .hero-overlay {
    background: rgba(18, 21, 38, 0.65) !important; /* Uniform dark tint over entire slide on mobile */
  }
  .hero-content {
    background: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: none !important;
    padding: 0 !important;
    box-shadow: none !important;
    display: block;
    width: 100%;
  }
  .hero-text-wrapper {
    min-height: auto;
    position: relative;
    width: 100%;
  }
  .hero-copy-shell {
    position: relative;
    bottom: auto;
    left: auto;
    padding-bottom: 0;
  }
  .hero-badge {
    font-size: 0.65rem;
    padding: 4px 10px;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.12);
    display: inline-block;
  }
  .hero-title {
    font-size: 1.45rem;
    line-height: 1.25;
    margin: 0 0 8px 0;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }
  .text-light {
    font-size: 1.1rem;
  }
  .hero-subtitle {
    font-size: 0.86rem;
    margin: 0;
    line-height: 1.4;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }
  .hero-dots {
    position: relative;
    margin-top: 14px;
    justify-content: flex-start;
  }
  .hero-ctas-bottom {
    position: relative;
    margin-top: 18px;
    width: 100%;
    flex-direction: row;
    justify-content: stretch;
    align-items: center;
    gap: 12px;
    z-index: 5;
    bottom: auto;
    right: auto;
  }
  .hero-ctas-bottom .btn-primary-custom, 
  .hero-ctas-bottom .btn-secondary-custom {
    flex: 1;
    width: auto;
    justify-content: center;
    padding: 11px 14px;
    font-size: 0.82rem;
  }

  @media (max-width: 480px) {
    .hero-section {
      height: 52vh;
      min-height: 420px;
    }
    .hero-dots {
      justify-content: center;
      margin-top: 16px;
    }
    .hero-ctas-bottom {
      flex-direction: column;
      gap: 8px;
      margin-top: 20px;
    }
    .hero-ctas-bottom .btn-primary-custom, 
    .hero-ctas-bottom .btn-secondary-custom {
      width: 100%;
    }
  }
  
  /* Rest of the fixes */
  .news-cards-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .visitor-objectives-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .showcase-grid {
    grid-template-columns: 1fr;
  }
  .showcase-info {
    padding: 24px;
  }
  .press-sidebar-column {
    padding: 24px 20px;
  }
  .showcase-image-wrap {
    min-height: 220px;
  }
  .portal-card {
    padding: 28px 20px;
  }
  .hero-ctas {
    justify-content: flex-start;
  }
  
  /* Newsletter Mobile Fix */
  .newsletter-box {
    padding: 30px 20px;
  }
  .news-press-grid {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .newsletter-form {
    min-width: 100%;
  }
  .newsletter-input-group {
    flex-direction: column;
  }
  .newsletter-input-group input {
    width: 100%;
  }
  .btn-newsletter {
    width: 100%;
    padding: 12px 20px;
  }
}

/* ─── Galerie 3D du Patrimoine Styles ─── */
.gallery-3d-section {
  padding: 40px 0;
  overflow: hidden;
  perspective: 1200px;
}
.section-subtitle-3d {
  font-size: 0.95rem;
  color: var(--brun);
  opacity: 0.8;
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.carousel-3d-viewport {
  position: relative;
  width: 100%;
  height: 480px;
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.carousel-3d-container {
  position: relative;
  width: 100%;
  height: 380px;
  transform-style: preserve-3d;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-3d {
  position: absolute;
  width: 320px;
  height: 365px;
  transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s, z-index 0.6s;
  transform-style: preserve-3d;
  cursor: pointer;
}
.card-3d-inner {
  width: 100%;
  height: 100%;
  border-radius: var(--radius);
  border: 1px solid rgba(132, 89, 54, 0.15);
  box-shadow: 0 15px 35px rgba(89, 55, 22, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.9);
}

html.theme-musee .card-3d-inner {
  background: rgba(18, 20, 32, 0.9) !important;
  border-color: rgba(212, 175, 55, 0.25) !important;
}

.card-3d-image-wrap {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: rgba(132, 89, 54, 0.05);
}
.card-3d-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.5s ease;
}
.card-3d:hover .card-3d-img {
  transform: scale(1.05);
}
.card-3d-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--brun);
  color: white;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
}
.card-3d-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.card-3d-info h3 {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--brun);
}
.card-3d-info p {
  margin: 0 0 16px;
  font-size: 0.82rem;
  line-height: 1.4;
  color: #666;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

html.theme-musee .card-3d-info p {
  color: rgba(255, 255, 255, 0.7) !important;
}

.btn-3d-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.25s, filter 0.25s;
  box-shadow: 0 4px 12px rgba(89, 55, 22, 0.15);
}
.btn-3d-action:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

/* ─── Positions 3D du carrousel ─── */
.card-3d.active {
  transform: translateX(0) translateZ(100px) rotateY(0deg);
  opacity: 1;
  z-index: 3;
}
.card-3d.right {
  transform: translateX(200px) translateZ(0px) rotateY(-35deg) scale(0.9);
  opacity: 0.65;
  z-index: 2;
}
.card-3d.left {
  transform: translateX(-200px) translateZ(0px) rotateY(35deg) scale(0.9);
  opacity: 0.65;
  z-index: 2;
}
.card-3d.hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateZ(-200px) scale(0.5);
}

.carousel-3d-controls {
  display: flex;
  gap: 24px;
  margin-top: 24px;
}
.ctrl-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid rgba(132, 89, 54, 0.25);
  background: white;
  color: var(--brun);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 4px 12px rgba(89, 55, 22, 0.05);
}
html.theme-musee .ctrl-btn {
  background: var(--blanc) !important;
  color: var(--brun) !important;
  border-color: rgba(212, 175, 55, 0.3) !important;
}

.ctrl-btn:hover {
  background: var(--brun);
  color: white;
  border-color: var(--brun);
  transform: scale(1.05);
}

@media(max-width: 768px) {
  .carousel-3d-viewport {
    height: 440px;
  }
  .card-3d {
    width: 260px;
    height: 320px;
  }
  .card-3d.right {
    transform: translateX(110px) translateZ(0px) rotateY(-35deg) scale(0.85);
  }
  .card-3d.left {
    transform: translateX(-110px) translateZ(0px) rotateY(35deg) scale(0.85);
  }
}

/* ─── Livre d'Or Institutional Clean Section ─── */
.livre-dor-preview-section {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.ld-static-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.ld-clean-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid rgba(132, 89, 54, 0.16);
  border-radius: 20px;
  padding: 24px 22px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(89, 55, 22, 0.06);
  transition: all 0.28s ease;
  position: relative;
}

html.theme-musee .ld-clean-card {
  background: rgba(20, 23, 40, 0.92) !important;
  border-color: rgba(212, 175, 55, 0.2) !important;
}

.ld-clean-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(89, 55, 22, 0.14);
  border-color: var(--or);
}

html.theme-musee .ld-clean-card:hover {
  box-shadow: 0 12px 32px rgba(212, 175, 55, 0.16) !important;
}

.ld-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ld-quote-mark {
  font-size: 2.4rem;
  font-family: Georgia, serif;
  color: var(--or);
  line-height: 0.7;
}

.ld-clean-date {
  font-size: 0.72rem;
  color: #a0a0a0;
  font-weight: 600;
}

.ld-clean-text {
  font-size: 0.88rem;
  line-height: 1.6;
  color: var(--noir);
  font-style: italic;
  margin: 0 0 20px 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

html.theme-musee .ld-clean-text {
  color: rgba(255, 255, 255, 0.9) !important;
}

.ld-clean-author-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border-top: 1px solid rgba(132, 89, 54, 0.12);
  padding-top: 14px;
}

html.theme-musee .ld-clean-author-row {
  border-color: rgba(212, 175, 55, 0.16) !important;
}

.ld-clean-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.ld-clean-name {
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--brun);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

html.theme-musee .ld-clean-name {
  color: var(--or) !important;
}

.ld-clean-location {
  font-size: 0.72rem;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

html.theme-musee .ld-clean-location {
  color: rgba(255, 255, 255, 0.5) !important;
}

@media (max-width: 1024px) {
  .ld-static-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .ld-static-grid {
    grid-template-columns: 1fr;
  }
}
</style>


