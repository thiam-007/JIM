<template>
  <section class="programme-page">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="calendar" :size="26" /></div>
        <div class="fh-title">Programme JIM 2026</div>
        <div class="fh-sub">Agenda des ateliers, interventions et événements publics</div>
      </div>
      <div class="fb">
        <div class="schedule-section" v-reveal="0">
          <h3>Programme officiel</h3>
          <div class="schedule-table">
            <table>
              <thead>
                <tr>
                  <th>Horaire</th>
                  <th>Lieu</th>
                  <th>Intitulé</th>
                  <th>Intervenant·e·s</th>
                  <th>Public</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in officialProgram" :key="item.title + item.time">
                  <td><span class="time-badge">{{ item.time }}</span></td>
                  <td>{{ item.location }}</td>
                  <td v-html="item.title"></td>
                  <td>{{ item.speakers }}</td>
                  <td><span class="audience-tag">{{ item.audience }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="schedule-section" v-reveal="100">
          <h3>Ateliers &amp; sessions participatives</h3>
          <div class="schedule-table">
            <table>
              <thead>
                <tr>
                  <th>Horaire</th>
                  <th>Lieu</th>
                  <th>Intitulé</th>
                  <th>Objectif</th>
                  <th>Public</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in atelierProgram" :key="item.title + item.time">
                  <td><span class="time-badge">{{ item.time }}</span></td>
                  <td>{{ item.location }}</td>
                  <td>{{ item.title }}</td>
                  <td>{{ item.objective }}</td>
                  <td><span class="audience-tag">{{ item.audience }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <EventRegistrationForm />
  </section>
</template>

<script setup>
import EventRegistrationForm from '../components/EventRegistrationForm.vue'
import AppIcon from '../components/AppIcon.vue'

const officialProgram = [
  { time: '8h30', location: 'Salle de conférence', title: 'Accueil des participant·e·s', speakers: "Équipe d'organisation", audience: 'Invités PROVGUI' },
  { time: '9h00 – 9h45', location: 'Salle de conférence', title: 'Présentation des projets <strong>PROV-GUI</strong> et <strong>REPAT-GUI</strong>', speakers: 'Amirou Conté · Ismaïlou Baldé · Marie‑Yvonne Curtis', audience: 'Invités PROVGUI' },
  { time: '9h45 – 10h45', location: 'Salle de conférence', title: 'Interventions des collaborateurs PROV‑GUI (France / Allemagne — dont distanciel)', speakers: 'Gaëlle Beaujean · Soizic Le Cornec · Didier Houénoudé · Barbara Plankensteiner', audience: 'Invités PROVGUI' },
  { time: '10h45 – 11h00', location: 'À préciser', title: 'Pause-café', speakers: '—', audience: 'Invités PROVGUI' },
  { time: '11h00 – 12h30', location: 'Salle de conférence', title: 'Cadres politiques, juridiques et diplomatiques des restitutions', speakers: 'Didier Houénoudé · Sylvie Memel‑Kassi', audience: 'Invités PROVGUI' },
  { time: '12h30 – 13h30', location: 'À préciser', title: 'Pause déjeuner', speakers: '—', audience: 'Invités PROVGUI' },
  { time: '13h30 – 16h30', location: 'Salle de conférence', title: 'Table ronde : recherche de provenance & projets financés par le fonds franco‑allemand', speakers: 'Julie Sissia · Franck Pacéré · Barbara Plankensteiner · Jean‑Paul Lawson · Ismaïlou Baldé · Mathieu Fribault · Marie‑Yvonne Curtis', audience: 'Invités PROVGUI' },
  { time: '18h00 – 20h00', location: 'CCFG', title: 'Projection du film <em>Dahomey</em> · conférence-débat', speakers: 'Didier Marcel Houénoudé · Julie Sissia · Jean-Paul Lawson · Ismailou Baldé · Sylvie Memel Kassi', audience: 'Tout public' },
  { time: '20h00 – 22h00', location: 'CCFG', title: 'Cocktail', speakers: '', audience: 'Sur invitation' }
]

const atelierProgram = [
  { time: '8h30 – 10h00', location: 'Salle des spectacles / conférence', title: 'Session 1 « La voix aux communautés »', objective: 'Présentations, attentes, mise en réseau', audience: 'Invités PROVGUI' },
  { time: '10h00 – 10h30', location: 'À préciser', title: 'Pause-café', objective: '—', audience: 'Invités PROVGUI' },
  { time: '10h30 – 12h30', location: 'Salle des spectacles / conférence', title: "Temps d'échange", objective: 'Retours sur PROV-GUI & REPAT-GUI, coopération musées / universités / communautés', audience: 'Invités PROVGUI' },
  { time: '12h30 – 13h30', location: 'À préciser', title: 'Pause déjeuner', objective: '—', audience: 'Invités PROVGUI' },
  { time: '13h30 – 15h00', location: 'Salle des spectacles', title: 'Atelier participatif (travail en groupes)', objective: "Imaginer comment présenter les objets aujourd'hui", audience: 'Invités PROVGUI' },
  { time: '15h00 – 16h00', location: 'Salle des spectacle', title: 'Restitution en plénière', objective: 'Partager les conclusions des groupes', audience: 'Invités PROVGUI' },
  { time: 'À partir de 16h00', location: 'Salle de spectacle', title: 'Conférence « Patrimoine & arts contemporains »', objective: 'Échange grand public — lien création contemporaine et patrimoine', audience: 'Tout public' },
  { time: '18h00', location: 'Espace extérieur', title: 'DJ & Concert (Samaya, Yudini, Med C, Sheba Queen, Espoirs de Coronthie)', objective: 'Soirée musicale et événement Tout public', audience: 'Tout public' }
]
</script>

<style scoped>
.schedule-section { margin-bottom: 2.5rem; }

.time-badge {
  display: inline-block;
  background: rgba(132, 89, 54, .1);
  color: var(--brun);
  font-size: .75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.audience-tag {
  display: inline-block;
  background: rgba(249, 178, 51, .12);
  color: var(--or);
  font-size: .72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
</style>
