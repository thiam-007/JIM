<template>
  <div class="home-wrapper">
    <!-- ─── Hero Section ─── -->
    <section class="hero-section" v-reveal="0">
      <div class="hero-bg">
        <img src="/images/banner-mvg.jpeg" alt="MVG event's background" class="hero-img" />
        <div class="hero-overlay"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">Plateforme Officielle</div>
        <h1 class="hero-title">
          <span class="text-light">Bienvenue sur</span><br />
          MVG <span class="text-gold">event's</span>
        </h1>
        <p class="hero-subtitle">
          La solution globale pour orchestrer, gérer et analyser tous vos événements avec la puissance du numérique.
        </p>
        <div class="hero-actions">
          <router-link to="/evenements" class="btn-primary">
            <AppIcon name="calendar" :size="18" /> Gérer mes événements
          </router-link>
          <router-link to="/invites" class="btn-secondary">
            <AppIcon name="users" :size="18" /> Base de contacts
          </router-link>
        </div>
      </div>
    </section>

    <!-- ─── Formats Section ─── -->
    <section class="formats-section" v-reveal="100">
      <div class="section-header">
        <h2>Formats d'événements</h2>
        <div class="section-divider"></div>
        <p>Une flexibilité totale pour répondre à tous vos besoins événementiels.</p>
      </div>
      <div class="formats-grid">
        <router-link to="/evenements" class="format-card">
          <div class="format-icon"><AppIcon name="map-pin" :size="32" /></div>
          <h3>Événements physiques</h3>
          <p>Gérez l'accueil, l'émargement sur place et la logistique de vos événements en présentiel.</p>
        </router-link>
        <router-link to="/evenements" class="format-card">
          <div class="format-icon"><AppIcon name="wifi" :size="32" /></div>
          <h3>Virtuels & webinaires</h3>
          <p>Organisez des sessions 100% en ligne avec gestion des liens de connexion et suivi d'audience.</p>
        </router-link>
        <router-link to="/evenements" class="format-card">
          <div class="format-icon"><AppIcon name="box" :size="32" /></div>
          <h3>Événements hybrides</h3>
          <p>Le meilleur des deux mondes : touchez une audience globale tout en conservant l'impact du présentiel.</p>
        </router-link>
      </div>
    </section>

    <!-- ─── Features Section ─── -->
    <section class="features-section" v-reveal="200">
      <div class="features-container form-card">
        <div class="fh fh-a">
          <div class="fh-icon"><AppIcon name="star" :size="26" /></div>
          <div class="fh-title">Fonctionnalités Clés</div>
          <div class="fh-sub">Tout ce dont vous avez besoin pour un événement réussi</div>
        </div>
        <div class="fb">
          <div class="features-grid">
            
            <router-link to="/invites" class="feat-card">
              <div class="feat-icon" style="color: var(--gold); background: rgba(249,178,51,0.15)"><AppIcon name="mail" :size="24" /></div>
              <div class="feat-text">
                <h4>Invitations & inscriptions</h4>
                <p>Créez des formulaires sur-mesure et gérez vos listes d'invités en quelques clics.</p>
              </div>
            </router-link>

            <router-link to="/evenements" class="feat-card">
              <div class="feat-icon" style="color: #2e7d32; background: rgba(46,125,50,0.1)"><AppIcon name="check-circle" :size="24" /></div>
              <div class="feat-text">
                <h4>Émargement rapide</h4>
                <p>Système de check-in fluide pour fluidifier l'accueil de vos participants le jour J.</p>
              </div>
            </router-link>

            <router-link to="/evenements" class="feat-card">
              <div class="feat-icon" style="color: var(--rouge); background: rgba(177,34,42,0.1)"><AppIcon name="message-circle" :size="24" /></div>
              <div class="feat-text">
                <h4>Communication automatisée</h4>
                <p>Envoyez des E-mails et SMS automatisés (rappels, confirmations, remerciements).</p>
              </div>
            </router-link>

            <router-link to="/evenements" class="feat-card">
              <div class="feat-icon" style="color: #1976d2; background: rgba(25,118,210,0.1)"><AppIcon name="file-text" :size="24" /></div>
              <div class="feat-text">
                <h4>Questionnaires & avis</h4>
                <p>Récoltez les retours de vos visiteurs via des enquêtes de satisfaction intégrées.</p>
              </div>
            </router-link>

            <router-link to="/evenements" class="feat-card feat-wide">
              <div class="feat-icon" style="color: var(--brun); background: rgba(89,55,22,0.1)"><AppIcon name="bar-chart" :size="24" /></div>
              <div class="feat-text">
                <h4>Rapports de données en temps réel</h4>
                <p>Mesurez l'impact de vos événements grâce à un tableau de bord analytique complet. Exportez vos données et optimisez vos futures éditions.</p>
              </div>
            </router-link>

          </div>
        </div>
      </div>
    </section>

    <!-- ─── Image showcase ─── -->
    <section class="showcase-section" v-reveal="300">
      <div class="showcase-grid">
        <img src="/images/side-photo.jpeg" alt="MVG exposition" class="showcase-img" />
        <img src="/images/affiche-jim-2026.jpeg" alt="JIM 2026" class="showcase-img" />
      </div>
    </section>

  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
</script>

<style scoped>
.home-wrapper {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-bottom: 40px;
}

/* ─── Hero Section ─── */
.hero-section {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 50px rgba(89,55,22,0.25);
  margin-top: 10px;
}
.hero-bg {
  position: absolute; inset: 0; z-index: 1;
}
.hero-img {
  width: 100%; height: 100%; object-fit: cover;
  transform: scale(1.05);
  animation: slowZoom 20s ease-in-out infinite alternate;
}
@keyframes slowZoom {
  from { transform: scale(1.02); }
  to { transform: scale(1.1); }
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(26,16,8,0.7) 0%, rgba(89,55,22,0.4) 100%);
  backdrop-filter: blur(2px);
}
.hero-content {
  position: relative; z-index: 2;
  text-align: center; color: #fff;
  padding: 40px 20px; max-width: 800px;
  animation: fadeInUp 0.8s ease-out;
}
.hero-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 16px; border-radius: 999px;
  font-size: 0.75rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 20px;
}
.hero-title {
  font-size: 3.5rem; font-weight: 900; line-height: 1.1;
  margin: 0 0 20px; text-transform: uppercase; letter-spacing: 2px;
}
.text-light { font-weight: 300; font-size: 2rem; opacity: 0.9; text-transform: none; letter-spacing: 0; }
.text-gold { color: var(--gold); }
.hero-subtitle {
  font-size: 1.1rem; line-height: 1.6; opacity: 0.9;
  margin: 0 auto 30px; max-width: 600px; font-family: Arial, sans-serif;
}
.hero-actions {
  display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;
}
.btn-primary, .btn-secondary {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 28px; border-radius: 999px;
  font-weight: 700; font-size: 0.9rem; text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.btn-primary {
  background: var(--gold); color: var(--brun);
  box-shadow: 0 8px 24px rgba(249,178,51,0.3);
}
.btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(249,178,51,0.5); background: #fff; }
.btn-secondary {
  background: rgba(255,255,255,0.1); color: #fff;
  border: 1px solid rgba(255,255,255,0.4);
  backdrop-filter: blur(10px);
}
.btn-secondary:hover { background: rgba(255,255,255,0.25); transform: translateY(-3px); border-color: #fff; }

/* ─── Formats Section ─── */
.formats-section {
  text-align: center;
}
.section-header h2 {
  font-size: 1.8rem; font-weight: 900; color: var(--brun);
  text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px;
}
.section-divider {
  width: 60px; height: 4px; background: var(--rouge);
  margin: 0 auto 16px; border-radius: 2px;
}
.section-header p {
  color: #666; font-size: 1rem; margin-bottom: 30px;
}
.formats-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
.format-card {
  background: #fff; border-radius: 20px; padding: 32px 24px;
  box-shadow: 0 10px 30px rgba(89,55,22,0.08);
  border: 1px solid rgba(132,89,54,0.1);
  transition: all 0.3s ease; position: relative; overflow: hidden;
  text-decoration: none; display: block;
}
.format-card::after {
  content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 4px;
  background: linear-gradient(90deg, var(--or), var(--rouge));
  transform: scaleX(0); transform-origin: left; transition: transform 0.4s ease;
}
.format-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(89,55,22,0.15); }
.format-card:hover::after { transform: scaleX(1); }
.format-icon {
  width: 64px; height: 64px; margin: 0 auto 20px;
  background: rgba(249,178,51,0.15); color: var(--or);
  border-radius: 16px; display: flex; align-items: center; justify-content: center;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.format-card:hover .format-icon { transform: scale(1.15) rotate(5deg); background: var(--or); color: #fff; }
.format-card h3 { font-size: 1.15rem; color: var(--brun); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.format-card p { color: #555; font-size: 0.9rem; line-height: 1.5; margin: 0; }

/* ─── Features Section ─── */
.features-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;
}
.feat-card {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 20px; border-radius: 16px;
  background: rgba(255,255,255,0.5); border: 1px solid rgba(132,89,54,0.1);
  transition: all 0.3s ease; text-decoration: none;
}
.feat-card:hover { background: #fff; transform: translateX(5px); box-shadow: 0 8px 24px rgba(89,55,22,0.08); border-color: var(--or); }
.feat-wide { grid-column: 1 / -1; background: linear-gradient(135deg, #fff 0%, #fffaf0 100%); }
.feat-icon {
  width: 50px; height: 50px; flex-shrink: 0;
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
}
.feat-text h4 { margin: 0 0 6px; font-size: 1.05rem; color: var(--brun); font-weight: 800; }
.feat-text p { margin: 0; font-size: 0.88rem; color: #555; line-height: 1.45; }

/* ─── Showcase Section ─── */
.showcase-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
}
.showcase-img {
  width: 100%; height: 280px; object-fit: cover;
  border-radius: 24px; box-shadow: 0 15px 35px rgba(89,55,22,0.15);
  transition: transform 0.5s ease;
}
.showcase-img:hover { transform: scale(1.02); }

/* ─── Responsive ─── */
@media (max-width: 800px) {
  .features-grid { grid-template-columns: 1fr; }
  .feat-wide { grid-column: auto; }
  .showcase-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .hero-title { font-size: 2.2rem; }
  .text-light { font-size: 1.4rem; }
  .hero-actions { flex-direction: column; }
  .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
}
</style>
