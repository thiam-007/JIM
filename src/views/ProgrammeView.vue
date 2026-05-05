<template>
  <section class="programme-page">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="calendar" :size="26" /></div>
        <div class="fh-title">Programme JIM 2026</div>
        <div class="fh-sub">16 – 18 mai 2026 · Les musées unissent un monde divisé</div>
      </div>
      <div class="fb">
        <p>Programme complet de la Journée Internationale des Musées 2026 organisée par le Musée Virtuel de Guinée, Expertise France et les partenaires.</p>

        <div class="stats-summary">
          <div class="stat-card" v-reveal="0">
            <strong>Total inscriptions</strong>
            <span>{{ totalRegistrations }}</span>
          </div>
          <div class="stat-card" v-reveal="100">
            <strong>Sessions enregistrées</strong>
            <span>{{ Object.keys(sessionCounts).length }}</span>
          </div>
        </div>

        <div class="session-counts" v-if="totalRegistrations > 0">
          <h3>Comptage par session</h3>
          <ul>
            <li v-for="(count, sessionTitle) in sessionCounts" :key="sessionTitle">
              <strong>{{ count }}</strong> participant·e·s enregistré·e·s pour <em>{{ sessionTitle }}</em>
            </li>
          </ul>
        </div>

        <!-- Tab navigation -->
        <div class="day-tabs" v-reveal="0">
          <button
            v-for="day in days"
            :key="day.id"
            class="day-tab"
            :class="{ active: activeDay === day.id }"
            @click="activeDay = day.id"
          >
            <span class="day-tab-date">{{ day.date }}</span>
            <span class="day-tab-label">{{ day.label }}</span>
          </button>
        </div>

        <!-- Samedi 16 mai -->
        <div v-if="activeDay === 'sam16'" class="schedule-section" v-reveal="0">
          <div class="day-header">
            <span class="day-badge">Samedi 16 mai</span>
            <span class="day-theme">Journée scientifique &amp; Musée virtuel</span>
          </div>
          <div class="audience-legend">
            <span class="tag-restreint">Sur invitation (Prov-Gui)</span>
            <span class="tag-public">Tout public</span>
          </div>
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
                <tr v-for="item in programme16" :key="item.title + item.time">
                  <td><span class="time-badge">{{ item.time }}</span></td>
                  <td>{{ item.location }}</td>
                  <td v-html="item.title"></td>
                  <td>{{ item.speakers }}</td>
                  <td>
                    <span class="audience-tag" :class="item.public === 'Tout public' ? 'public' : 'restreint'">
                      {{ item.public }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Pôles MVG -->
          <div class="poles-section">
            <h4>Pôles d'activités — Musée Virtuel (10h – 16h · Grande salle 1er étage)</h4>
            <div class="poles-grid">
              <div class="pole-card" v-for="pole in poles" :key="pole.id" v-reveal="pole.delay">
                <div class="pole-icon">{{ pole.icon }}</div>
                <div class="pole-num">Pôle {{ pole.id }}</div>
                <div class="pole-title">{{ pole.title }}</div>
                <div class="pole-desc">{{ pole.desc }}</div>
                <div class="pole-team">{{ pole.team }}</div>
              </div>
            </div>
            <div class="rotation-note">
              Groupes tournants de 10–15 personnes · 15 min par pôle · 5 min de transition
            </div>
          </div>
        </div>

        <!-- Dimanche 17 mai -->
        <div v-if="activeDay === 'dim17'" class="schedule-section" v-reveal="0">
          <div class="day-header">
            <span class="day-badge">Dimanche 17 mai</span>
            <span class="day-theme">Ateliers communautaires &amp; culture contemporaine</span>
          </div>
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
                <tr v-for="item in programme17" :key="item.title + item.time">
                  <td><span class="time-badge">{{ item.time }}</span></td>
                  <td>{{ item.location }}</td>
                  <td v-html="item.title"></td>
                  <td>{{ item.speakers }}</td>
                  <td>
                    <span class="audience-tag" :class="item.public === 'Tout public' ? 'public' : 'restreint'">
                      {{ item.public }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Lundi 18 mai -->
        <div v-if="activeDay === 'lun18'" class="schedule-section" v-reveal="0">
          <div class="day-header">
            <span class="day-badge highlight">Lundi 18 mai — Journée officielle</span>
            <span class="day-theme">Journée Internationale des Musées</span>
          </div>
          <div class="schedule-table">
            <table>
              <thead>
                <tr>
                  <th>Horaire</th>
                  <th>Intitulé</th>
                  <th>Intervenant·e·s</th>
                  <th>Format / Public</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in programme18" :key="item.title + item.time">
                  <td><span class="time-badge">{{ item.time }}</span></td>
                  <td v-html="item.title"></td>
                  <td>{{ item.speakers }}</td>
                  <td><span class="audience-tag public">{{ item.public }}</span></td>
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
import { computed, ref } from 'vue'
import { useAirtableStore } from '../store/airtable'
import EventRegistrationForm from '../components/EventRegistrationForm.vue'
import AppIcon from '../components/AppIcon.vue'

const airtable = useAirtableStore()
const totalRegistrations = computed(() => airtable.totalRegistrations)
const sessionCounts = computed(() => airtable.sessionCounts)

const activeDay = ref('sam16')

const days = [
  { id: 'sam16', date: '16 mai', label: 'Scientifique' },
  { id: 'dim17', date: '17 mai', label: 'Communautés' },
  { id: 'lun18', date: '18 mai', label: 'Officielle' }
]

// --- SAMEDI 16 MAI ---
const programme16 = [
  {
    time: '9h – 13h',
    location: 'Salle des spectacles du Musée',
    title: 'Présentation des projets <strong>REPATGUI</strong> · enjeux de collaboration, recherche de provenance et restitution',
    speakers: 'Projet Prov-Gui',
    public: 'Sur invitation (Prov-Gui)'
  },
  {
    time: '13h – 14h',
    location: 'À préciser',
    title: 'Pause déjeuner',
    speakers: '—',
    public: 'Sur invitation (Prov-Gui)'
  },
  {
    time: '14h – 18h',
    location: 'Salle des spectacles du Musée',
    title: 'Table ronde : cadre juridique et restitutions · recherche de provenance',
    speakers: 'À préciser',
    public: 'Sur invitation (Prov-Gui)'
  },
  {
    time: '18h – 20h',
    location: 'CCFG',
    title: 'Projection du film <em>Dahomey</em> suivie d\'un débat sur les restitutions',
    speakers: 'Didier Houénoudé · Sylvie Memel Kassi · Barbara Plankensteiner · Modération : Mathieu Fribault &amp; Marie-Yvonne Curtis',
    public: 'Tout public'
  }
]

const poles = [
  {
    id: '1',
    icon: '📸',
    title: 'Deviens photographe du patrimoine',
    desc: 'Initiation aux techniques de photographie d\'objets patrimoniaux. Démonstration, mise en pratique, débrief.',
    team: 'Summum 3D · équipe photo · médiation MVG',
    delay: 0
  },
  {
    id: '2',
    icon: '🧊',
    title: 'Explore un objet en 3D',
    desc: 'Manipulation interactive d\'objets 3D du patrimoine guinéen : rotation, zoom, observation des détails.',
    team: 'Les Mohs · médiateur·rice MVG',
    delay: 100
  },
  {
    id: '3',
    icon: '🗣️',
    title: 'Raconte l\'histoire d\'un objet',
    desc: 'Démarche créative — les participant·e·s inventent une histoire, un contexte, un personnage à partir d\'un objet.',
    team: 'Incubé·e·s MVG · référent·e médiation',
    delay: 200
  }
]

// --- DIMANCHE 17 MAI ---
const programme17 = [
  {
    time: '9h – 13h',
    location: 'Salle des spectacles',
    title: 'Prov-Gui &amp; Repat-Gui · Échanges avec les communautés et parties prenantes',
    speakers: 'À préciser',
    public: 'Sur invitation'
  },
  {
    time: '13h – 14h',
    location: 'À préciser',
    title: 'Pause déjeuner',
    speakers: '—',
    public: 'Sur invitation'
  },
  {
    time: '14h – 18h',
    location: 'Salle des spectacles',
    title: 'Prov-Gui &amp; Repat-Gui · Suite des ateliers avec les communautés et parties prenantes',
    speakers: 'À préciser',
    public: 'Sur invitation'
  },
  {
    time: '16h – 18h',
    location: 'Zone extérieure',
    title: 'Conférence-débat · Patrimoine et art contemporain',
    speakers: 'Lucie Touya · Audrey Chazal (modération) · Yacine Diallo · Didier Houénoudé',
    public: 'Tout public'
  },
  {
    time: '18h – 20h',
    location: 'Zone extérieure',
    title: 'Curation artistique · Concert &amp; DJ',
    speakers: 'À préciser',
    public: 'Tout public'
  }
]

// --- LUNDI 18 MAI ---
const programme18 = [
  {
    time: '9h – 11h',
    title: 'Atelier de travail · Patrimoine, traduction &amp; IA',
    speakers: 'Danielle Wozny · Jean-Paul Lawson · Ismailou Baldé · Safiatou Diallo · Didier Houénoudé · Mathieu Fribault · Oumar Camara (IRPLA)',
    public: 'IRPLA – 40 personnes max'
  },
  {
    time: '15h00 – 15h30',
    title: 'Accueil officiel',
    speakers: 'À préciser',
    public: 'Musée – espace extérieur'
  },
  {
    time: '15h30 – 16h15',
    title: 'Cérémonie officielle et discours',
    speakers: 'À préciser',
    public: 'Musée – espace extérieur'
  },
  {
    time: '16h15 – 17h15',
    title: 'Conférence · Résultats RepatGui sur la recherche de provenance',
    speakers: 'À préciser',
    public: 'Musée – espace extérieur'
  },
  {
    time: '17h15',
    title: 'Lancement du vernissage',
    speakers: 'À préciser',
    public: 'Musée'
  },
  {
    time: '18h30',
    title: 'Fin de la Journée',
    speakers: '—',
    public: 'Musée – espace extérieur'
  }
]
</script>

<style scoped>
/* Day tabs */
.day-tabs {
  display: flex;
  gap: 0.75rem;
  margin: 1.5rem 0;
  flex-wrap: wrap;
}

.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem 1.25rem;
  border: 2px solid #e8ddd0;
  border-radius: 14px;
  background: #fefcf9;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
  gap: 2px;
  min-width: 90px;
}
.day-tab:hover { border-color: var(--or); background: #fff9f0; }
.day-tab.active {
  border-color: var(--brun);
  background: linear-gradient(135deg, var(--brun), #a0673a);
  color: #fff;
}

.day-tab-date {
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.5px;
}
.day-tab-label {
  font-size: 0.72rem;
  opacity: 0.85;
}

/* Day header */
.day-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.day-badge {
  display: inline-block;
  background: var(--brun);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
}
.day-badge.highlight {
  background: linear-gradient(135deg, var(--brun), var(--or));
}
.day-theme {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}

/* Audience legend */
.audience-legend {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

/* Schedule */
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
  font-size: .72rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  white-space: nowrap;
}
.audience-tag.public {
  background: rgba(249, 178, 51, .12);
  color: var(--or);
}
.audience-tag.restreint {
  background: rgba(132, 89, 54, .1);
  color: var(--brun);
}
.tag-restreint {
  font-size: .75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(132, 89, 54, .1);
  color: var(--brun);
}
.tag-public {
  font-size: .75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(249, 178, 51, .12);
  color: var(--or);
}

/* Poles */
.poles-section {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f3ed, #fefcf9);
  border: 1px solid #e8ddd0;
  border-radius: 16px;
}
.poles-section h4 {
  font-size: .9rem;
  color: var(--brun);
  margin-bottom: 1.2rem;
  font-weight: 700;
}
.poles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.pole-card {
  background: #fff;
  border: 1px solid #e8ddd0;
  border-radius: 12px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.pole-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(132,89,54,.12);
}
.pole-icon { font-size: 1.6rem; }
.pole-num { font-size: .72rem; font-weight: 700; color: var(--or); text-transform: uppercase; }
.pole-title { font-size: .95rem; font-weight: 700; color: var(--brun); }
.pole-desc { font-size: .82rem; color: #555; line-height: 1.45; flex: 1; }
.pole-team { font-size: .75rem; color: #999; font-style: italic; margin-top: 4px; }

.rotation-note {
  font-size: .78rem;
  color: #888;
  text-align: center;
  font-style: italic;
  border-top: 1px solid #e8ddd0;
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .day-tabs { gap: 0.5rem; }
  .day-tab { min-width: 80px; padding: 0.6rem 0.9rem; }
  .poles-grid { grid-template-columns: 1fr; }
}
</style>
