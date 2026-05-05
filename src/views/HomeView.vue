<template>
  <section class="home-intro">

    <!-- ─── Hero banner ─── -->
    <div class="hero-banner" v-reveal="0">
      <img src="/images/banner-mvg.jpeg" alt="Musée Virtuel de Guinée" class="hero-img" />
      <div class="hero-overlay">
        <div class="hero-text">
          <div class="hero-title">JIM 2026</div>
          <div class="hero-sub">Journée Internationale des Musées · 16 – 18 Mai 2026</div>
        </div>
      </div>
    </div>

    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="landmark" :size="26" /></div>
        <div class="fh-title">Portail JIM 2026</div>
        <div class="fh-sub">Application dédiée au Musée Virtuel de Guinée · événements, pôles et retours visiteurs</div>
      </div>
      <div class="fb">

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
            <div class="event-time">8h30 – 12h30 &amp; 13h30 – 18h00</div>
            <div class="event-title">Programme officiel</div>
            <div class="event-desc">Conférences, interventions et table ronde sur la provenance et les restitutions</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
          <div class="event-card" v-reveal="200">
            <div class="event-badge">
              <AppIcon name="users" :size="14" />
            </div>
            <div class="event-time">8h30 – 12h30 &amp; 13h30 – 16h00</div>
            <div class="event-title">Sessions participatives</div>
            <div class="event-desc">Ateliers, échanges en groupes et restitution en plénière</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
          <div class="event-card" v-reveal="300">
            <div class="event-badge">
              <AppIcon name="music" :size="14" />
            </div>
            <div class="event-time">18h00 – 22h00</div>
            <div class="event-title">Événement du soir</div>
            <div class="event-desc">Projection film Dahomey, conférence-débat, concert et cocktail</div>
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

        <!-- ─── Galerie photos ─── -->
        <div class="sd" v-reveal="0">
          <div class="sl"></div>
          <span>En images</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="photo-gallery" v-reveal="80">
          <div class="photo-main">
            <img src="/images/affiche-jim-2026.jpeg" alt="Affiche JIM 2026" />
          </div>
          <div class="photo-stack">
            <div class="photo-side">
              <img src="/images/stand-mvg.jpeg" alt="Stand Musée Virtuel de Guinée" />
            </div>
            <div class="photo-side">
              <img src="/images/side-photo.jpeg" alt="Chantier des collections" />
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
</script>

<style scoped>
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

/* ─── Hero banner ─── */
.hero-banner {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  height: 200px;
  box-shadow: 0 12px 36px rgba(89,55,22,.18);
}
.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  display: block;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(89,55,22,.75) 0%, rgba(89,55,22,.2) 60%, transparent 100%);
  display: flex;
  align-items: flex-end;
  padding: 24px 28px;
}
.hero-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: #fff;
  letter-spacing: 2px;
  text-transform: uppercase;
  line-height: 1;
}
.hero-sub {
  font-size: .75rem;
  color: rgba(255,255,255,.85);
  margin-top: 5px;
  letter-spacing: 1px;
}

/* ─── Galerie ─── */
.photo-gallery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 4px;
  margin-bottom: 4px;
}
.photo-main img,
.photo-side img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 14px;
  transition: transform .3s ease, box-shadow .3s ease;
}
.photo-main { height: 260px; }
.photo-main img:hover { transform: scale(1.02); box-shadow: 0 12px 32px rgba(89,55,22,.2); }
.photo-stack { display: flex; flex-direction: column; gap: 12px; }
.photo-side { height: 122px; overflow: hidden; border-radius: 14px; }
.photo-side img:hover { transform: scale(1.04); }

@media (max-width: 768px) {
  .events-grid { grid-template-columns: 1fr; }
  .nav-grid { grid-template-columns: repeat(2, 1fr); }
  .photo-gallery { grid-template-columns: 1fr; }
  .photo-main { height: 200px; }
  .photo-stack { flex-direction: row; }
  .photo-side { height: 120px; flex: 1; }
}
</style>
