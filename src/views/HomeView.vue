<template>
  <section class="home-intro">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon">🏛️</div>
        <div class="fh-title">Portail JIM 2026</div>
        <div class="fh-sub">Application dédiée au Musée Virtuel de Guinée · événements, pôles et retours visiteurs</div>
      </div>
      <div class="fb">
        <p>Bienvenue dans l’outil événementiel JIM 2026. Cette version Vue.js permet de gérer plusieurs formulaires, maintenir une connexion Airtable et préparer l’ajout de nouveaux ateliers.</p>
        
        <div class="sd"><div class="sl"></div><span>Événements principaux</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>
        
        <div class="events-grid">
          <div class="event-card">
            <div class="event-time">8h30 – 12h30 & 13h30 – 18h00</div>
            <div class="event-title">Programme officiel</div>
            <div class="event-desc">Conférences, interventions et table ronde sur la provenance et les restitutions</div>
            <router-link to="/programme" class="event-link">Voir détails →</router-link>
          </div>
          <div class="event-card">
            <div class="event-time">8h30 – 12h30 & 13h30 – 16h00</div>
            <div class="event-title">Sessions participatives</div>
            <div class="event-desc">Ateliers, échanges en groupes et restitution en plénière</div>
            <router-link to="/programme" class="event-link">Voir détails →</router-link>
          </div>
          <div class="event-card">
            <div class="event-time">18h00 – 22h00</div>
            <div class="event-title">Événement du soir</div>
            <div class="event-desc">Projection film Dahomey, conférence-débat, concert et cocktail</div>
            <router-link to="/programme" class="event-link">Voir détails →</router-link>
          </div>
        </div>
        
        <div class="sd"><div class="sl"></div><span>Navigation</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>
        <div class="pc">
          <router-link class="pcard" to="/programme"><div class="pi">📅</div><div class="pn">Programme complet</div></router-link>
          <router-link class="pcard" to="/stats"><div class="pi">📈</div><div class="pn">Statistiques</div></router-link>
          <router-link class="pcard" to="/accueil"><div class="pi">🏛️</div><div class="pn">Accueil visiteurs</div></router-link>
          <router-link class="pcard" to="/suivi"><div class="pi">📊</div><div class="pn">Suivi par pôle</div></router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.home-intro {
  animation: fadeIn 0.6s ease-in-out;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 1.5rem 0;
}

.event-card {
  background: linear-gradient(135deg, #f8f3ed 0%, #fefcf9 100%);
  border: 1px solid #e8ddd0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: fadeInUp 0.6s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.event-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(132, 89, 54, 0.02), rgba(249, 178, 51, 0.05));
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.event-card:nth-child(1) { animation-delay: 0.2s; }
.event-card:nth-child(2) { animation-delay: 0.3s; }
.event-card:nth-child(3) { animation-delay: 0.4s; }

.event-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 40px rgba(132, 89, 54, 0.2);
  border-color: var(--or);
}

.event-card:hover::before {
  opacity: 1;
}

.event-time {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--or);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: slideInLeft 0.5s ease-out backwards;
  animation-delay: 0.3s;
}

.event-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--brun);
  animation: slideInLeft 0.5s ease-out backwards;
  animation-delay: 0.35s;
}

.event-desc {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.4;
  flex: 1;
  animation: slideInLeft 0.5s ease-out backwards;
  animation-delay: 0.4s;
}

.event-link {
  color: var(--or);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  animation: slideInLeft 0.5s ease-out backwards;
  animation-delay: 0.45s;
}

.event-link:hover {
  color: var(--rouge);
  transform: translateX(4px);
}

.sd {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0 1rem 0;
  opacity: 0.6;
}

.sl {
  height: 1px;
  background: linear-gradient(90deg, var(--or), transparent);
  flex: 1;
}

.sd span {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pc {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.pcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f3ed 0%, #fefcf9 100%);
  border: 1px solid #e8ddd0;
  border-radius: 12px;
  text-decoration: none;
  color: var(--brun);
  transition: all 0.3s ease;
  gap: 0.75rem;
}

.pcard:hover {
  transform: translateY(-4px);
  background: linear-gradient(135deg, #fef5ec 0%, #fffbf7 100%);
  border-color: var(--or);
  box-shadow: 0 8px 24px rgba(132, 89, 54, 0.15);
}

.pi {
  font-size: 2rem;
}

.pn {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-16px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .events-grid {
    grid-template-columns: 1fr;
  }

  .pc {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
