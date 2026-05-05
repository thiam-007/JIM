<template>
  <section class="home-intro">

    <!-- ── Bannière hero ── -->
    <div class="hero-banner" :class="{ 'has-image': bannerLoaded }">
      <img
        :src="'/images/banner.jpg'"
        alt="Bannière JIM 2026"
        class="hero-banner-img"
        @load="bannerLoaded = true"
        @error="bannerLoaded = false"
      />
      <div class="hero-overlay">
        <div class="hero-content">
          <div class="hero-date">16 – 18 mai 2026 · Conakry, Guinée</div>
          <h2 class="hero-title">Journée Internationale des Musées</h2>
          <p class="hero-theme">« Les musées unissent un monde divisé »</p>
          <div class="hero-partners">
            <span>Musée Virtuel de Guinée</span>
            <span class="sep">·</span>
            <span>Expertise France</span>
            <span class="sep">·</span>
            <span>Prov-Gui · Repat-Gui</span>
          </div>
        </div>
      </div>
    </div>

    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="landmark" :size="26" /></div>
        <div class="fh-title">Portail JIM 2026</div>
        <div class="fh-sub">Musée Virtuel de Guinée · 16–18 mai 2026 · <em>Les musées unissent un monde divisé</em></div>
      </div>
      <div class="fb">
        <p>Bienvenue dans l'outil événementiel JIM 2026. Cette version Vue.js permet de gérer plusieurs formulaires, maintenir une connexion Airtable et préparer l'ajout de nouveaux ateliers.</p>

        <div class="sd">
          <div class="sl"></div>
          <span>Événements principaux</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="events-grid">
          <div class="event-card" v-reveal="100">
            <div class="event-badge">
              <AppIcon name="clock" :size="14" />
            </div>
            <div class="event-time">Samedi 16 mai</div>
            <div class="event-title">Journée scientifique</div>
            <div class="event-desc">Présentation Prov-Gui &amp; Repat-Gui, pôles d'activités Musée Virtuel, projection du film <em>Dahomey</em> au CCFG</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
          <div class="event-card" v-reveal="200">
            <div class="event-badge">
              <AppIcon name="users" :size="14" />
            </div>
            <div class="event-time">Dimanche 17 mai</div>
            <div class="event-title">Ateliers communautaires</div>
            <div class="event-desc">Échanges Prov-Gui avec les communautés, conférence-débat patrimoine &amp; art contemporain, curation artistique</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
          <div class="event-card" v-reveal="300">
            <div class="event-badge">
              <AppIcon name="music" :size="14" />
            </div>
            <div class="event-time">Lundi 18 mai — JIM</div>
            <div class="event-title">Journée officielle</div>
            <div class="event-desc">Atelier IA &amp; patrimoine, cérémonie officielle, conférence RepatGui, vernissage</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
        </div>

        <div class="sd">
          <div class="sl"></div>
          <span>Navigation</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="nav-grid">
          <router-link class="nav-pcard" to="/programme" v-reveal="100">
            <div class="nav-pcard-icon"><AppIcon name="calendar" :size="28" /></div>
            <div class="nav-pcard-name">Programme complet</div>
          </router-link>
          <router-link class="nav-pcard" to="/stats" v-reveal="150">
            <div class="nav-pcard-icon"><AppIcon name="trending-up" :size="28" /></div>
            <div class="nav-pcard-name">Statistiques</div>
          </router-link>
          <router-link class="nav-pcard" to="/accueil" v-reveal="200">
            <div class="nav-pcard-icon"><AppIcon name="landmark" :size="28" /></div>
            <div class="nav-pcard-name">Accueil visiteurs</div>
          </router-link>
          <router-link class="nav-pcard" to="/suivi" v-reveal="250">
            <div class="nav-pcard-icon"><AppIcon name="bar-chart" :size="28" /></div>
            <div class="nav-pcard-name">Suivi par pôle</div>
          </router-link>
        </div>

        <!-- ── Side photo + texte d'intro ── -->
        <div class="side-layout" v-reveal="0">
          <div class="side-photo-wrap">
            <img
              v-if="sideLoaded"
              :src="'/images/side-photo.jpg'"
              alt="Musée Virtuel de Guinée"
              class="side-photo"
              @error="sideLoaded = false"
            />
            <div v-else class="side-photo-placeholder">
              <AppIcon name="landmark" :size="48" />
              <span>Photo à venir</span>
            </div>
          </div>
          <div class="side-text">
            <h3>Le Musée Virtuel de Guinée</h3>
            <p>Espace de médiation, de recherche, de transmission et d'innovation, le Musée Virtuel de Guinée valorise le patrimoine culturel guinéen à travers des outils numériques accessibles à tous.</p>
            <p>Pour cette édition 2026 de la JIM, le MVG coordonne les pôles d'activités, la programmation scientifique et les espaces de rencontre entre publics, chercheurs et communautés.</p>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const bannerLoaded = ref(false)
const sideLoaded = ref(true)
</script>

<style scoped>
/* ── Hero banner ── */
.hero-banner {
  position: relative;
  width: 100%;
  height: 320px;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #5c3519 0%, #8f5b2c 40%, #f7bf39 100%);
  display: flex;
  align-items: flex-end;
}
.hero-banner-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: none;
}
.hero-banner.has-image .hero-banner-img { display: block; }
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(30, 15, 5, .75) 0%, rgba(30, 15, 5, .25) 55%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 2rem;
}
.hero-content { color: #fff; }
.hero-date {
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: .85;
  margin-bottom: 6px;
}
.hero-title {
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1.1;
  margin: 0 0 8px;
  text-shadow: 0 2px 12px rgba(0,0,0,.4);
}
.hero-theme {
  font-size: .9rem;
  font-style: italic;
  opacity: .9;
  margin: 0 0 10px;
}
.hero-partners {
  font-size: .72rem;
  opacity: .75;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.hero-partners .sep { opacity: .5; }

/* ── Side layout ── */
.side-layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 1.5rem;
  align-items: start;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e8ddd0;
}
.side-photo-wrap {
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e8ddd0;
  background: linear-gradient(135deg, #f0e4d4, #e8d5bc);
}
.side-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.side-photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #bba98a;
  font-size: .78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.side-text h3 {
  color: var(--brun);
  margin-top: 0;
  font-size: 1.05rem;
}
.side-text p {
  font-size: .88rem;
  color: #555;
  line-height: 1.6;
  margin-top: 0;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.event-card {
  background: linear-gradient(135deg, #f8f3ed 0%, #fefcf9 100%);
  border: 1px solid #e8ddd0;
  border-radius: 14px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: relative;
  overflow: hidden;
  transition: all 0.32s cubic-bezier(.4, 0, .2, 1);
  cursor: default;
}

.event-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(132, 89, 54, 0.02), rgba(249, 178, 51, 0.06));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.event-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 44px rgba(132, 89, 54, 0.18);
  border-color: var(--or);
}

.event-card:hover::before { opacity: 1; }

.event-badge {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 4px;
  transition: transform 0.3s ease;
}
.event-card:hover .event-badge { transform: rotate(8deg) scale(1.1); }

.event-time {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--or);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.event-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--brun);
}

.event-desc {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.45;
  flex: 1;
}

.event-link {
  color: var(--or);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.88rem;
  transition: all 0.25s ease;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.event-link:hover {
  color: var(--rouge);
  gap: 10px;
}

/* Navigation cards */
.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.nav-pcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, #f8f3ed 0%, #fefcf9 100%);
  border: 2px solid #e8ddd0;
  border-radius: 16px;
  text-decoration: none;
  color: var(--brun);
  transition: all 0.3s cubic-bezier(.4, 0, .2, 1);
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}

.nav-pcard::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(132,89,54,.05), rgba(249,178,51,.08));
  opacity: 0;
  transition: opacity 0.3s;
}
.nav-pcard:hover::after { opacity: 1; }

.nav-pcard:hover {
  transform: translateY(-5px);
  border-color: var(--or);
  box-shadow: 0 12px 32px rgba(132, 89, 54, .16);
}

.nav-pcard-icon {
  color: var(--or);
  transition: transform 0.3s ease, color 0.3s ease;
}
.nav-pcard:hover .nav-pcard-icon {
  color: var(--brun);
  transform: scale(1.15);
}

.nav-pcard-name {
  font-size: 0.85rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.3px;
}

@media (max-width: 768px) {
  .events-grid { grid-template-columns: 1fr; }
  .nav-grid { grid-template-columns: repeat(2, 1fr); }
  .hero-banner { height: 220px; }
  .hero-title { font-size: 1.2rem; }
  .side-layout { grid-template-columns: 1fr; }
  .side-photo-wrap { aspect-ratio: 16/7; }
}
</style>
