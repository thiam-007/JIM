<template>
  <section class="programme-page">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="calendar" :size="26" /></div>
        <div class="fh-title">Programme JIM 2026</div>
        <div class="fh-sub">Journée Internationale des Musées · Musée National de Guinée · 16–18 Mai 2026</div>
      </div>

      <div class="fb">
        <div class="stats-summary">
          <div class="stat-card" v-reveal="0">
            <strong>Total inscriptions</strong>
            <span>{{ totalRegistrations }}</span>
          </div>
          <div class="stat-card" v-reveal="80">
            <strong>Sessions enregistrées</strong>
            <span>{{ Object.keys(sessionCounts).length }}</span>
          </div>
          <div class="stat-card" v-reveal="160">
            <strong>Jours d'événement</strong>
            <span>3</span>
          </div>
        </div>

        <!-- Onglets jours -->
        <div class="day-tabs" v-reveal="0">
          <button
            v-for="jour in jours"
            :key="jour.id"
            class="day-tab"
            :class="{ active: activeJour === jour.id }"
            @click="activeJour = jour.id"
          >
            <span class="tab-label">{{ jour.short }}</span>
            <span class="tab-date">{{ jour.date }}</span>
          </button>
        </div>

        <Transition name="tab-fade" mode="out-in">
          <div :key="activeJour" class="day-content">

            <!-- JOUR 1 -->
            <div v-if="activeJour === 'jour1'">
              <div class="venue-block" v-reveal="0">
                <div class="venue-header">
                  <AppIcon name="landmark" :size="18" />
                  <span>Musée National de Guinée — Salle de conférence</span>
                </div>
                <div class="timeline">
                  <div v-for="item in jour1Conf" :key="item.time" class="tl-item" :class="item.type || ''">
                    <div class="tl-time">{{ item.time }}</div>
                    <div class="tl-dot"><div class="dot-inner"></div></div>
                    <div class="tl-body">
                      <div class="tl-title" v-html="item.title"></div>
                      <div class="tl-speakers" v-if="item.speakers">
                        <AppIcon name="user" :size="13" /> {{ item.speakers }}
                      </div>
                      <div class="tl-tags">
                        <span class="audience-tag" v-if="item.audience">{{ item.audience }}</span>
                        <span class="venue-tag" v-if="item.tag">{{ item.tag }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="venue-block" v-reveal="60">
                <div class="venue-header">
                  <AppIcon name="film" :size="18" />
                  <span>Centre Culturel Franco-Guinéen (CCFG)</span>
                </div>
                <div class="timeline">
                  <div v-for="item in jour1CCFG" :key="item.time" class="tl-item" :class="item.type || ''">
                    <div class="tl-time">{{ item.time }}</div>
                    <div class="tl-dot"><div class="dot-inner"></div></div>
                    <div class="tl-body">
                      <div class="tl-title" v-html="item.title"></div>
                      <div class="tl-speakers" v-if="item.speakers">
                        <AppIcon name="user" :size="13" /> {{ item.speakers }}
                      </div>
                      <div class="tl-tags">
                        <span class="audience-tag" v-if="item.audience">{{ item.audience }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- JOUR 2 -->
            <div v-else-if="activeJour === 'jour2'">
              <div class="venue-block" v-reveal="0">
                <div class="venue-header">
                  <AppIcon name="users" :size="18" />
                  <span>Musée National de Guinée — Salle des spectacles / conférence</span>
                </div>
                <div class="timeline">
                  <div v-for="item in jour2Salle" :key="item.time" class="tl-item" :class="item.type || ''">
                    <div class="tl-time">{{ item.time }}</div>
                    <div class="tl-dot"><div class="dot-inner"></div></div>
                    <div class="tl-body">
                      <div class="tl-title" v-html="item.title"></div>
                      <div class="tl-desc" v-if="item.desc">{{ item.desc }}</div>
                      <div class="tl-speakers" v-if="item.speakers">
                        <AppIcon name="user" :size="13" /> {{ item.speakers }}
                      </div>
                      <div class="tl-tags">
                        <span class="audience-tag" v-if="item.audience">{{ item.audience }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="venue-block" v-reveal="60">
                <div class="venue-header">
                  <AppIcon name="landmark" :size="18" />
                  <span>Espace extérieur — Musée National</span>
                </div>
                <div class="timeline">
                  <div v-for="item in jour2Ext" :key="item.time" class="tl-item" :class="item.type || ''">
                    <div class="tl-time">{{ item.time }}</div>
                    <div class="tl-dot"><div class="dot-inner"></div></div>
                    <div class="tl-body">
                      <div class="tl-title" v-html="item.title"></div>
                      <div class="tl-desc" v-if="item.desc">{{ item.desc }}</div>
                      <div class="tl-tags">
                        <span class="audience-tag" v-if="item.audience">{{ item.audience }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- JOUR 3 -->
            <div v-else-if="activeJour === 'jour3'">
              <div class="jim-banner" v-reveal="0">
                <AppIcon name="star" :size="22" />
                <div>
                  <strong>Journée Internationale des Musées</strong>
                  <p>Activités ouvertes au grand public — Rotations entre les pôles du Musée Virtuel de Guinée</p>
                </div>
              </div>

              <div class="poles-mini-grid" v-reveal="40">
                <div class="pole-mini-card">
                  <div class="pole-mini-icon"><AppIcon name="camera" :size="24" /></div>
                  <div class="pole-mini-name">Pôle Photo</div>
                  <div class="pole-mini-desc">Prise de vue & portrait numérique d'objets de collection</div>
                </div>
                <div class="pole-mini-card">
                  <div class="pole-mini-icon"><AppIcon name="box" :size="24" /></div>
                  <div class="pole-mini-name">Pôle 3D</div>
                  <div class="pole-mini-desc">Numérisation 3D & visite immersive du patrimoine</div>
                </div>
                <div class="pole-mini-card">
                  <div class="pole-mini-icon"><AppIcon name="message-circle" :size="24" /></div>
                  <div class="pole-mini-name">Pôle Récit</div>
                  <div class="pole-mini-desc">Collecte de mémoires & rédaction de notices patrimoniales</div>
                </div>
              </div>

              <div class="venue-block" v-reveal="80">
                <div class="venue-header">
                  <AppIcon name="landmark" :size="18" />
                  <span>Musée National de Guinée — Programme du Jour</span>
                </div>
                <div class="timeline">
                  <div v-for="item in jour3" :key="item.time" class="tl-item" :class="item.type || ''">
                    <div class="tl-time">{{ item.time }}</div>
                    <div class="tl-dot"><div class="dot-inner"></div></div>
                    <div class="tl-body">
                      <div class="tl-title" v-html="item.title"></div>
                      <div class="tl-desc" v-if="item.desc">{{ item.desc }}</div>
                      <div class="tl-tags">
                        <span class="audience-tag" v-if="item.audience">{{ item.audience }}</span>
                        <span class="venue-tag" v-if="item.tag">{{ item.tag }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rotation-info" v-reveal="100">
                <div class="ri-title"><AppIcon name="refresh-cw" :size="16" /> Système de rotation des groupes</div>
                <div class="ri-groups">
                  <div class="ri-group rouge-g">
                    <span class="group-dot rouge-dot"></span>
                    <strong>Groupe Rouge</strong>
                    <span>Photo → 3D → Récit</span>
                  </div>
                  <div class="ri-group jaune-g">
                    <span class="group-dot jaune-dot"></span>
                    <strong>Groupe Jaune</strong>
                    <span>3D → Récit → Photo</span>
                  </div>
                  <div class="ri-group vert-g">
                    <span class="group-dot vert-dot"></span>
                    <strong>Groupe Vert</strong>
                    <span>Récit → Photo → 3D</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Transition>

        <!-- Comptage sessions -->
        <div class="session-counts" v-if="totalRegistrations > 0" v-reveal="0">
          <div class="sc-header"><AppIcon name="bar-chart" :size="16" /> Comptage par session</div>
          <div class="sc-list">
            <div class="sc-item" v-for="(count, sessionTitle) in sessionCounts" :key="sessionTitle">
              <div class="sc-label">{{ sessionTitle }}</div>
              <div class="sc-bar-wrap">
                <div class="sc-bar" :style="{ width: Math.round((count / maxCount) * 100) + '%' }"></div>
              </div>
              <div class="sc-count">{{ count }}</div>
            </div>
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
const maxCount = computed(() => Math.max(...Object.values(sessionCounts.value), 1))

const activeJour = ref('jour1')

const jours = [
  { id: 'jour1', short: 'Jour 1', date: 'Samedi 16 Mai' },
  { id: 'jour2', short: 'Jour 2', date: 'Dimanche 17 Mai' },
  { id: 'jour3', short: 'Jour 3', date: 'Lundi 18 Mai' },
]

// ─── JOUR 1 — Salle de conférence ───────────────────────────────────────────
const jour1Conf = [
  {
    time: '8h30',
    title: 'Accueil des participant·e·s',
    speakers: "Équipe d'organisation",
    audience: 'Invités PROVGUI',
    type: 'accent'
  },
  {
    time: '9h00 – 9h45',
    title: 'Présentation des projets <strong>PROV-GUI</strong> et <strong>REPAT-GUI</strong>',
    speakers: 'Amirou Conté · Ismaïlou Baldé · Marie‑Yvonne Curtis',
    audience: 'Invités PROVGUI'
  },
  {
    time: '9h45 – 10h45',
    title: 'Interventions des collaborateurs PROV‑GUI (France / Allemagne — dont distanciel)',
    speakers: 'Gaëlle Beaujean · Soizic Le Cornec · Didier Houénoudé · Barbara Plankensteiner',
    audience: 'Invités PROVGUI',
    tag: 'Visioconférence incluse'
  },
  {
    time: '10h45 – 11h00',
    title: 'Pause-café',
    type: 'break'
  },
  {
    time: '11h00 – 12h30',
    title: 'Cadres politiques, juridiques et diplomatiques des restitutions',
    speakers: 'Didier Houénoudé · Sylvie Memel‑Kassi',
    audience: 'Invités PROVGUI'
  },
  {
    time: '12h30 – 13h30',
    title: 'Pause déjeuner',
    type: 'break'
  },
  {
    time: '13h30 – 16h30',
    title: 'Table ronde : recherche de provenance & projets financés par le fonds franco‑allemand',
    speakers: 'Julie Sissia · Franck Pacéré · Barbara Plankensteiner · Jean‑Paul Lawson · Ismaïlou Baldé · Mathieu Fribault · Marie‑Yvonne Curtis',
    audience: 'Invités PROVGUI'
  },
  {
    time: '16h30',
    title: 'Fin de la séance',
    type: 'break'
  }
]

// ─── JOUR 1 — CCFG ──────────────────────────────────────────────────────────
const jour1CCFG = [
  {
    time: '18h00 – 20h00',
    title: 'Projection du film <em>Dahomey</em> · conférence-débat',
    speakers: 'Didier Marcel Houénoudé · Julie Sissia · Jean-Paul Lawson · Ismaïlou Baldé · Sylvie Memel-Kassi',
    audience: 'Tout public',
    type: 'highlight'
  },
  {
    time: '20h00 – 22h00',
    title: 'Cocktail',
    audience: 'Sur invitation',
    type: 'accent'
  }
]

// ─── JOUR 2 — Salle des spectacles ──────────────────────────────────────────
const jour2Salle = [
  {
    time: '8h30 – 10h00',
    title: "Session 1 « La voix aux communautés »",
    desc: 'Présentations, attentes des participants, mise en réseau',
    audience: 'Invités PROVGUI',
    type: 'accent'
  },
  {
    time: '10h00 – 10h30',
    title: 'Pause-café',
    type: 'break'
  },
  {
    time: '10h30 – 12h30',
    title: "Temps d'échange",
    desc: "Retours d'expérience sur PROV-GUI & REPAT-GUI · Coopération musées / universités / communautés",
    audience: 'Invités PROVGUI'
  },
  {
    time: '12h30 – 13h30',
    title: 'Pause déjeuner',
    type: 'break'
  },
  {
    time: '13h30 – 15h00',
    title: 'Atelier participatif — travail en groupes',
    desc: "Imaginer comment présenter les objets de collection aujourd'hui",
    audience: 'Invités PROVGUI'
  },
  {
    time: '15h00 – 16h00',
    title: 'Restitution en plénière',
    desc: 'Partage des conclusions et recommandations par groupe',
    audience: 'Invités PROVGUI'
  },
  {
    time: 'À partir de 16h00',
    title: 'Conférence « Patrimoine & arts contemporains »',
    desc: 'Lien entre création contemporaine et patrimoine culturel guinéen',
    audience: 'Tout public',
    type: 'highlight'
  }
]

// ─── JOUR 2 — Espace extérieur ───────────────────────────────────────────────
const jour2Ext = [
  {
    time: '18h00',
    title: 'DJ & Concert',
    desc: 'Samaya · Yudini · Med C · Sheba Queen · Espoirs de Coronthie',
    audience: 'Tout public',
    type: 'highlight'
  }
]

// ─── JOUR 3 — Lundi 18 mai (JIM) ────────────────────────────────────────────
const jour3 = [
  {
    time: '8h30 – 9h00',
    title: 'Accueil du public & installation des pôles',
    desc: "Attribution des groupes (Rouge / Jaune / Vert) et briefing d'accueil",
    audience: 'Tout public',
    type: 'accent'
  },
  {
    time: '9h00 – 12h00',
    title: 'Session 1 — Rotations Pôle Photo · Pôle 3D · Pôle Récit',
    desc: '3 rotations de 45 minutes — groupes guidés par les référent·e·s de pôle',
    audience: 'Groupes Rouge / Jaune / Vert',
    tag: 'Musée Virtuel de Guinée'
  },
  {
    time: '12h00 – 13h00',
    title: 'Pause déjeuner',
    type: 'break'
  },
  {
    time: '13h00 – 16h00',
    title: 'Session 2 — Rotations Pôle Photo · Pôle 3D · Pôle Récit',
    desc: '3 rotations de 45 minutes — nouveaux groupes du public',
    audience: 'Tout public',
    tag: 'Musée Virtuel de Guinée'
  },
  {
    time: '14h00 – 15h30',
    title: "Conférence : « Le Musée à l'ère du numérique »",
    desc: "Présentation du Musée Virtuel de Guinée et des enjeux de la numérisation du patrimoine africain",
    speakers: 'Amirou Conté · Équipe MVG',
    audience: 'Tout public',
    type: 'highlight'
  },
  {
    time: '16h00 – 17h00',
    title: 'Bilan & clôture de la JIM 2026',
    desc: 'Présentation des productions réalisées, remerciements, perspectives',
    speakers: "Direction du Musée National de Guinée · Équipe d'organisation",
    audience: 'Tous',
    type: 'accent'
  }
]
</script>

<style scoped>
/* ─── Onglets ─── */
.day-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0e8df;
  padding-bottom: 0;
}

.day-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 18px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: all 0.25s ease;
  border-radius: 8px 8px 0 0;
}

.day-tab:hover {
  background: rgba(132, 89, 54, .06);
}

.day-tab.active {
  border-bottom-color: var(--or);
  background: rgba(249, 178, 51, .07);
}

.tab-label {
  font-size: .85rem;
  font-weight: 800;
  color: #bbb;
  text-transform: uppercase;
  letter-spacing: .5px;
  transition: color 0.25s;
}

.tab-date {
  font-size: .72rem;
  color: #ccc;
  font-weight: 600;
  transition: color 0.25s;
}

.day-tab.active .tab-label { color: var(--brun); }
.day-tab.active .tab-date  { color: var(--or); }

/* ─── Transition onglets ─── */
.tab-fade-enter-active,
.tab-fade-leave-active { transition: opacity 0.22s ease, transform 0.22s ease; }
.tab-fade-enter-from { opacity: 0; transform: translateY(8px); }
.tab-fade-leave-to  { opacity: 0; transform: translateY(-6px); }

/* ─── Bloc lieu ─── */
.venue-block {
  margin-bottom: 28px;
}

.venue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .8rem;
  font-weight: 700;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: .5px;
  padding: 8px 12px;
  background: rgba(132, 89, 54, .06);
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 3px solid var(--or);
}

/* ─── Timeline ─── */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 8px;
}

.tl-item {
  display: grid;
  grid-template-columns: 100px 24px 1fr;
  gap: 0 12px;
  position: relative;
  padding-bottom: 20px;
}

.tl-item:last-child { padding-bottom: 0; }

/* Connecting line between dots */
.tl-item:not(:last-child) .tl-dot::after {
  content: '';
  position: absolute;
  top: 22px;
  left: 107px;
  width: 2px;
  height: calc(100% - 4px);
  background: #f0e8df;
}

.tl-time {
  font-size: .72rem;
  font-weight: 700;
  color: #999;
  padding-top: 4px;
  text-align: right;
  line-height: 1.3;
}

.tl-dot {
  display: flex;
  align-items: flex-start;
  padding-top: 6px;
  position: relative;
}

.dot-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #d4c4b4;
  border: 2px solid #f5efe8;
  flex-shrink: 0;
  transition: background 0.2s;
}

.tl-item.accent .dot-inner   { background: var(--or); border-color: rgba(249,178,51,.2); }
.tl-item.highlight .dot-inner { background: var(--rouge); border-color: rgba(177,34,42,.2); }
.tl-item.break .dot-inner    { background: #e0d6cc; }

.tl-body { padding-top: 2px; }

.tl-title {
  font-size: .88rem;
  font-weight: 700;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
}

.tl-item.break .tl-title {
  color: #aaa;
  font-weight: 500;
  font-style: italic;
}

.tl-desc {
  font-size: .78rem;
  color: #888;
  line-height: 1.45;
  margin-bottom: 4px;
}

.tl-speakers {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: .76rem;
  color: var(--brun);
  font-weight: 600;
  margin-bottom: 4px;
  opacity: .85;
}

.tl-tags { display: flex; gap: 6px; flex-wrap: wrap; }

.audience-tag {
  display: inline-block;
  background: rgba(249, 178, 51, .12);
  color: var(--or);
  font-size: .68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
  white-space: nowrap;
}

.venue-tag {
  display: inline-block;
  background: rgba(132, 89, 54, .08);
  color: var(--brun);
  font-size: .68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
  white-space: nowrap;
}

/* ─── JIM Banner ─── */
.jim-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: linear-gradient(135deg, rgba(132,89,54,.08), rgba(249,178,51,.1));
  border: 1px solid rgba(249,178,51,.25);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 20px;
  color: var(--brun);
}

.jim-banner strong { font-size: .95rem; display: block; margin-bottom: 4px; }
.jim-banner p { font-size: .8rem; color: #888; margin: 0; line-height: 1.5; }
.jim-banner .app-icon { color: var(--or); flex-shrink: 0; margin-top: 2px; }

/* ─── Pôles mini ─── */
.poles-mini-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.pole-mini-card {
  border: 1.5px solid #ede5da;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  background: rgba(255,255,255,.95);
  transition: box-shadow 0.2s;
}

.pole-mini-card:hover { box-shadow: 0 4px 16px rgba(132,89,54,.1); }

.pole-mini-icon { color: var(--or); margin-bottom: 8px; display: flex; justify-content: center; }
.pole-mini-name { font-size: .8rem; font-weight: 800; color: var(--brun); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
.pole-mini-desc { font-size: .72rem; color: #999; line-height: 1.4; }

/* ─── Rotation info ─── */
.rotation-info {
  background: rgba(255,255,255,.9);
  border: 1.5px solid #ede5da;
  border-radius: 12px;
  padding: 16px 18px;
  margin-top: 20px;
}

.ri-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .82rem;
  font-weight: 700;
  color: var(--brun);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: .4px;
}

.ri-groups {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.ri-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 160px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: .78rem;
}

.ri-group strong { display: block; font-size: .8rem; margin-bottom: 2px; }
.ri-group span   { color: #888; font-size: .74rem; }

.rouge-g { background: rgba(220,53,69,.06); border: 1px solid rgba(220,53,69,.2); }
.jaune-g { background: rgba(212,160,23,.06); border: 1px solid rgba(212,160,23,.2); }
.vert-g  { background: rgba(40,167,69,.06);  border: 1px solid rgba(40,167,69,.2); }

.group-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.rouge-dot { background: #dc3545; }
.jaune-dot { background: #d4a017; }
.vert-dot  { background: #28a745; }

/* ─── Comptage sessions ─── */
.session-counts {
  margin-top: 28px;
  border-top: 2px solid #f0e8df;
  padding-top: 20px;
}

.sc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: .82rem;
  font-weight: 700;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: .4px;
  margin-bottom: 14px;
}

.sc-list { display: flex; flex-direction: column; gap: 8px; }

.sc-item {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
}

.sc-label { font-size: .8rem; color: #555; font-weight: 600; }

.sc-bar-wrap {
  width: 120px;
  height: 6px;
  background: #f0e8df;
  border-radius: 3px;
  overflow: hidden;
}

.sc-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brun), var(--or));
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(.4, 0, .2, 1);
}

.sc-count {
  font-size: .82rem;
  font-weight: 800;
  color: var(--brun);
  min-width: 24px;
  text-align: right;
}

@media (max-width: 580px) {
  .tl-item { grid-template-columns: 80px 20px 1fr; gap: 0 8px; }
  .tl-time { font-size: .66rem; }
  .poles-mini-grid { grid-template-columns: 1fr; }
  .ri-groups { flex-direction: column; }
  .day-tab { padding: 8px 12px 10px; }
  .tab-label { font-size: .78rem; }
  .tab-date  { font-size: .66rem; }
}
</style>
