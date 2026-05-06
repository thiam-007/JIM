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

    <!-- ─── Compte à rebours ─── -->
    <div class="countdown-banner" v-reveal="0">
      <template v-if="!eventStarted">
        <div class="countdown-label">
          <AppIcon name="clock" :size="16" /> Début de l'événement dans
        </div>
        <div class="countdown-units">
          <div class="countdown-unit">
            <span class="cu-num">{{ countdown.days }}</span>
            <span class="cu-label">Jours</span>
          </div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit">
            <span class="cu-num">{{ countdown.hours }}</span>
            <span class="cu-label">Heures</span>
          </div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit">
            <span class="cu-num">{{ countdown.minutes }}</span>
            <span class="cu-label">Min</span>
          </div>
          <div class="countdown-sep">:</div>
          <div class="countdown-unit">
            <span class="cu-num">{{ countdown.seconds }}</span>
            <span class="cu-label">Sec</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="event-live">
          <AppIcon name="zap" :size="20" />
          L'événement est en cours · Bienvenue à la JIM 2026 !
        </div>
      </template>
    </div>

    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="landmark" :size="26" /></div>
        <div class="fh-title">Portail JIM 2026</div>
        <div class="fh-sub">Application dédiée au Musée Virtuel de Guinée · événements, pôles et retours visiteurs</div>
      </div>
      <div class="fb">

        <!-- ─── Événements principaux ─── -->
        <div class="sd">
          <div class="sl"></div>
          <span>Événements principaux</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="events-grid">
          <div class="event-card" v-reveal="100">
            <div class="event-badge"><AppIcon name="clock" :size="14" /></div>
            <div class="event-time">8h30 – 12h30 &amp; 13h30 – 18h00</div>
            <div class="event-title">Programme officiel</div>
            <div class="event-desc">Conférences, interventions et table ronde sur la provenance et les restitutions</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
          <div class="event-card" v-reveal="200">
            <div class="event-badge"><AppIcon name="users" :size="14" /></div>
            <div class="event-time">8h30 – 12h30 &amp; 13h30 – 16h00</div>
            <div class="event-title">Sessions participatives</div>
            <div class="event-desc">Ateliers, échanges en groupes et restitution en plénière</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
          <div class="event-card" v-reveal="300">
            <div class="event-badge"><AppIcon name="music" :size="14" /></div>
            <div class="event-time">18h00 – 22h00</div>
            <div class="event-title">Événement du soir</div>
            <div class="event-desc">Projection film Dahomey, conférence-débat, concert et cocktail</div>
            <router-link to="/programme" class="event-link">
              Voir détails <AppIcon name="trending-up" :size="14" />
            </router-link>
          </div>
        </div>

        <!-- ─── Section JIM 2026 ─── -->
        <div class="sd" v-reveal="0">
          <div class="sl"></div>
          <span>JIM 2026</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="jim-section">
          <div class="jim-text anim-from-left" v-reveal="60">
            <h2 class="jim-heading">Journée Internationale des Musées</h2>
            <p class="jim-para">Le Musée Virtuel de Guinée célèbre la JIM 2026 autour du thème <strong>« Les musées unissent un monde divisé »</strong>. Trois jours de conférences, d'ateliers participatifs, de rencontres et de culture ouverts à tous les publics.</p>
            <p class="jim-para">Du 16 au 18 mai 2026, le MVG réunit chercheurs, artistes, communautés et visiteurs pour explorer la provenance, les restitutions et le rôle du patrimoine dans le monde contemporain.</p>
            <router-link to="/programme" class="jim-cta">
              <AppIcon name="calendar" :size="16" /> Voir le programme complet
            </router-link>
          </div>
          <div class="jim-photo anim-from-right" v-reveal="120">
            <img src="/images/affiche-jim-2026.jpeg" alt="Affiche JIM 2026" />
          </div>
        </div>

        <!-- ─── Section Chantier des collections ─── -->
        <div class="sd" v-reveal="0">
          <div class="sl"></div>
          <span>Chantier des collections</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="chantier-section">
          <div class="chantier-photo anim-from-left" v-reveal="60">
            <img src="/images/side-photo.jpeg" alt="Chantier des collections — expérience immersive" />
          </div>
          <div class="chantier-text anim-from-right" v-reveal="120">
            <h2 class="chantier-heading">Une expérience immersive au cœur du patrimoine</h2>
            <p class="chantier-para">Le chantier des collections du Musée Virtuel de Guinée invite le public à découvrir les coulisses de la numérisation du patrimoine guinéen. Casques de réalité virtuelle, modèles 3D et récits oraux se conjuguent pour offrir une plongée inédite dans l'histoire des objets.</p>
            <p class="chantier-para">Cette initiative pionnière en Afrique de l'Ouest ouvre la voie à une muséologie participative et accessible, connectant passé et futur à travers la technologie.</p>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const EVENT_DATE = new Date('2026-05-16T08:30:00')
const EVENT_END  = new Date('2026-05-18T23:59:59')

const countdown    = reactive({ days: '00', hours: '00', minutes: '00', seconds: '00' })
const eventStarted = ref(false)
let timer = null

function pad(n) { return String(n).padStart(2, '0') }

function tick() {
  const now  = new Date()
  if (now >= EVENT_DATE && now <= EVENT_END) { eventStarted.value = true; return }
  if (now > EVENT_END)  { eventStarted.value = true; return }
  const diff = EVENT_DATE - now
  countdown.days    = pad(Math.floor(diff / 86400000))
  countdown.hours   = pad(Math.floor((diff % 86400000) / 3600000))
  countdown.minutes = pad(Math.floor((diff % 3600000)  / 60000))
  countdown.seconds = pad(Math.floor((diff % 60000)    / 1000))
}

onMounted(() => { tick(); timer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
/* ─── Compte à rebours ─── */
.countdown-banner {
  background: linear-gradient(135deg, #5c3519, #8f5b2c);
  border-radius: 20px;
  padding: 20px 28px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 10px 32px rgba(89,55,22,.22);
  position: relative;
  overflow: hidden;
}
.countdown-banner::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(60deg, rgba(255,255,255,.04) 0, rgba(255,255,255,.04) 1px, transparent 1px, transparent 18px);
}
.countdown-label {
  font-size: .72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 2px;
  color: rgba(255,255,255,.75);
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-bottom: 14px; position: relative;
}
.countdown-units {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; position: relative;
}
.countdown-unit {
  display: flex; flex-direction: column; align-items: center;
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.2);
  border-radius: 14px; padding: 10px 18px; min-width: 72px;
}
.cu-num {
  font-size: 2rem; font-weight: 900; color: #fff;
  line-height: 1; font-variant-numeric: tabular-nums;
}
.cu-label {
  font-size: .62rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.5px;
  color: rgba(255,255,255,.65); margin-top: 4px;
}
.countdown-sep {
  font-size: 1.8rem; font-weight: 900;
  color: rgba(255,255,255,.5); margin-bottom: 16px;
}
.event-live {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 1rem; font-weight: 800; color: #fff;
  text-transform: uppercase; letter-spacing: 1.5px;
  animation: pulse 1.5s ease-in-out infinite;
}
@media (max-width: 480px) {
  .countdown-unit { min-width: 56px; padding: 8px 12px; }
  .cu-num { font-size: 1.5rem; }
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
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; margin-bottom: 4px;
  transition: transform 0.3s ease;
}
.event-card:hover .event-badge { transform: rotate(8deg) scale(1.1); }

.event-time {
  font-size: 0.8rem; font-weight: 700;
  color: var(--or); text-transform: uppercase; letter-spacing: 0.5px;
}
.event-title { font-size: 1.05rem; font-weight: 700; color: var(--brun); }
.event-desc { font-size: 0.9rem; color: #666; line-height: 1.45; flex: 1; }

.event-link {
  color: var(--or); text-decoration: none; font-weight: 600; font-size: 0.88rem;
  transition: all 0.25s ease; align-self: flex-start;
  display: flex; align-items: center; gap: 6px; margin-top: 4px;
}
.event-link:hover { color: var(--rouge); gap: 10px; }

/* ─── Hero banner ─── */
.hero-banner {
  position: relative; border-radius: 20px; overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 12px 36px rgba(89,55,22,.18);
}
.hero-img {
  width: 100%; height: auto;
  display: block;
  transform-origin: center;
}
.hero-banner.revealed .hero-img {
  animation: heroZoom 1.4s cubic-bezier(.22, 1, .36, 1) forwards;
}
@keyframes heroZoom {
  from { transform: scale(1.07); }
  to   { transform: scale(1); }
}
.hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to right, rgba(89,55,22,.75) 0%, rgba(89,55,22,.2) 60%, transparent 100%);
  display: flex; align-items: flex-end; padding: 32px 36px;
  pointer-events: none;
}
.hero-title {
  font-size: 2.2rem; font-weight: 900; color: #fff;
  letter-spacing: 3px; text-transform: uppercase; line-height: 1;
}
.hero-banner.revealed .hero-title {
  animation: heroTextUp .7s cubic-bezier(.22, 1, .36, 1) .35s both;
}
.hero-banner.revealed .hero-sub {
  animation: heroTextUp .7s cubic-bezier(.22, 1, .36, 1) .55s both;
}
@keyframes heroTextUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hero-sub {
  font-size: .8rem; color: rgba(255,255,255,.85); margin-top: 6px; letter-spacing: 1px;
}

/* ─── Directional reveals ─── */
.anim-from-left.will-reveal  { opacity: 0; transform: translateX(-44px); }
.anim-from-left.revealed     { opacity: 1; transform: translateX(0); transition: opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }
.anim-from-right.will-reveal { opacity: 0; transform: translateX(44px); }
.anim-from-right.revealed    { opacity: 1; transform: translateX(0); transition: opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }

/* ─── JIM section ─── */
.jim-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 28px;
  align-items: center;
  margin: 0 0 8px;
}
.jim-heading {
  font-size: 1.25rem; font-weight: 900; color: var(--brun);
  text-transform: uppercase; letter-spacing: 1px; margin: 0 0 14px;
}
.jim-para {
  font-size: .92rem; color: #555; line-height: 1.65; margin: 0 0 12px;
}
.jim-cta {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; text-decoration: none;
  padding: 12px 22px; border-radius: 999px;
  font-size: .85rem; font-weight: 700;
  transition: all .28s cubic-bezier(.4,0,.2,1);
  margin-top: 6px;
}
.jim-cta:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 10px 24px rgba(89,55,22,.22); }
.jim-photo { width: 320px; flex-shrink: 0; }
.jim-photo img {
  width: 100%; height: auto; object-fit: contain;
  border-radius: 18px; display: block;
  box-shadow: 0 12px 32px rgba(89,55,22,.18);
  transition: transform .45s ease, box-shadow .45s ease;
}
.jim-photo:hover img {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 28px 56px rgba(89,55,22,.28);
}

/* ─── Chantier section ─── */
.chantier-section {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 28px;
  align-items: center;
  margin: 0 0 8px;
}
.chantier-photo { width: 260px; flex-shrink: 0; }
.chantier-photo img {
  width: 100%; height: 320px; object-fit: cover;
  border-radius: 18px; display: block;
  box-shadow: 0 12px 32px rgba(89,55,22,.18);
  transition: transform .45s ease, box-shadow .45s ease;
}
.chantier-photo:hover img {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 28px 56px rgba(89,55,22,.28);
}
.chantier-heading {
  font-size: 1.15rem; font-weight: 900; color: var(--brun);
  text-transform: uppercase; letter-spacing: .8px; margin: 0 0 14px;
}
.chantier-para {
  font-size: .92rem; color: #555; line-height: 1.65; margin: 0 0 12px;
}

@media (max-width: 768px) {
  .events-grid { grid-template-columns: 1fr; }
  .hero-banner { height: 220px; }
  .jim-section { grid-template-columns: 1fr; }
  .jim-photo { width: 100%; }
  .jim-photo img { height: 220px; }
  .chantier-section { grid-template-columns: 1fr; }
  .chantier-photo { width: 100%; }
  .chantier-photo img { height: 220px; }
}
</style>
