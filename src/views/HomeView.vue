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
        <div class="sd"><div class="sl"></div><span>Commencer ici</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>
        <div class="pc">
          <router-link class="pcard" to="/programme"><div class="pi">📅</div><div class="pn">Programme</div></router-link>
          <router-link class="pcard" to="/stats"><div class="pi">📈</div><div class="pn">Statistiques</div></router-link>
          <router-link class="pcard" to="/accueil"><div class="pi">🏛️</div><div class="pn">Accueil visiteurs</div></router-link>
          <router-link class="pcard" to="/suivi"><div class="pi">📊</div><div class="pn">Suivi par pôle</div></router-link>
          <router-link class="pcard" to="/avis"><div class="pi">⭐</div><div class="pn">Avis visiteurs</div></router-link>
        </div>
      </div>
    </div>
  </section>
</template>
