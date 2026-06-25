<template>
  <div class="ap-wrapper">
    <!-- ─── Hero Header / En-tête du Projet ─── -->
    <section class="ap-hero-section" v-reveal="0">
      <div class="ap-hero-bg">
        <img src="/images/banner_apropos.png" alt="" class="ap-hero-img-blur" />
        <img src="/images/banner_apropos.png" alt="MVG exposition showcase" class="ap-hero-img-contain" />
        <div class="ap-hero-overlay"></div>
      </div>
      <div class="ap-hero-content">
        <div class="ap-hero-badge">Plateforme Numérique</div>
        <h1 class="ap-hero-title">Musée Virtuel de Guinée</h1>
        <p class="ap-hero-subtitle">
          Explorer, préserver et transmettre les cultures de Guinée à l'ère du numérique.
        </p>
      </div>
    </section>

    <!-- ─── Introduction & Vision ─── -->
    <section class="ap-intro-section" v-reveal="100">
      <div class="form-card intro-card">
        <div class="fh fh-a">
          <div class="fh-icon"><AppIcon name="info" :size="24" /></div>
          <div class="fh-title">Vision & Missions</div>
        </div>
        <div class="fb intro-body">
          <p class="vision-lead">
            Le <strong>Musée Virtuel de Guinée (MVG)</strong> est une initiative innovante conçue pour répondre aux défis de conservation, d'accessibilité et de valorisation du patrimoine artistique, culturel et historique guinéen. 
          </p>
          <p class="vision-text">
            En unissant recherche anthropologique, techniques de préservation traditionnelles et outils de modélisation 3D de pointe, le projet MVG jette un pont entre la richesse ancestrale de nos terroirs et la modernité digitale mondiale.
          </p>
        </div>
      </div>
    </section>

    <!-- ─── Les Objectifs Clés (02) ─── -->
    <section class="ap-objectives-section" v-reveal="150">
      <div class="section-title-wrap">
        <h2>Objectifs Stratégiques</h2>
        <div class="section-divider"></div>
      </div>

      <div class="objectives-grid">
        <div class="obj-card form-card">
          <div class="obj-num">01</div>
          <div class="obj-icon"><AppIcon name="file-text" :size="24" /></div>
          <h3>Documenter & Préserver</h3>
          <p>Inventorier et documenter scientifiquement les patrimoines culturels matériels et immatériels guinéens.</p>
        </div>

        <div class="obj-card form-card">
          <div class="obj-num">02</div>
          <div class="obj-icon"><AppIcon name="users" :size="24" /></div>
          <h3>Rendre Accessible</h3>
          <p>Diffuser notre héritage culturel auprès de tous les publics locaux et internationaux sans barrière physique.</p>
        </div>

        <div class="obj-card form-card">
          <div class="obj-num">03</div>
          <div class="obj-icon"><AppIcon name="star" :size="24" /></div>
          <h3>Soutenir l'Éducation</h3>
          <p>Créer des supports interactifs pour la recherche universitaire, l'apprentissage scolaire et la création artistique.</p>
        </div>

        <div class="obj-card form-card">
          <div class="obj-num">04</div>
          <div class="obj-icon"><AppIcon name="globe" :size="24" /></div>
          <h3>Promouvoir à l'Étranger</h3>
          <p>Accroître le rayonnement de l'art et de l'artisanat guinéens à travers des expositions digitales globales.</p>
        </div>
      </div>
    </section>

    <!-- ─── Focus : Chantier des Collections ─── -->
    <section class="ap-collections-section" v-reveal="200">
      <div class="form-card collections-card">
        <div class="collections-grid">
          <div class="collections-image-wrap">
            <img src="/images/side-photo.jpeg" alt="Chantier des collections" class="collections-img" />
            <div class="img-overlay-badge">Musée National de Guinée</div>
          </div>
          <div class="collections-info">
            <span class="focus-pre"><AppIcon name="sparkles" :size="12" /> Action en cours</span>
            <h3 class="focus-main-title">Le Chantier des Collections</h3>
            <p>
              Le chantier des collections est une opération majeure menée au cœur du <strong>Musée national de Guinée (Sandervalia)</strong>. Elle consiste à inventorier de manière exhaustive les réserves du musée, à diagnostiquer l'état sanitaire des œuvres, et à procéder à des restaurations d'urgence.
            </p>
            <p>
              Une fois préservés, les masques rituels, instruments de musique traditionnels et objets royaux sont photographiés sous tous les angles et scannés à l'aide de scanners laser optiques 3D. Ce processus garantit une empreinte numérique inaltérable de notre histoire.
            </p>
            <div class="collections-workflow">
              <div class="flow-step">
                <div class="step-circle"><AppIcon name="edit" :size="14" /></div>
                <span>Inventaire</span>
              </div>
              <div class="flow-arrow"><AppIcon name="chevron-right" :size="12" /></div>
              <div class="flow-step">
                <div class="step-circle"><AppIcon name="shield" :size="14" /></div>
                <span>Restauration</span>
              </div>
              <div class="flow-arrow"><AppIcon name="chevron-right" :size="12" /></div>
              <div class="flow-step">
                <div class="step-circle"><AppIcon name="camera" :size="14" /></div>
                <span>Modélisation 3D</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Nos Activités (03 & 05) ─── -->
    <section class="ap-activities-section" v-reveal="250">
      <div class="section-title-wrap">
        <h2>Piliers d'Activité</h2>
        <div class="section-divider"></div>
      </div>

      <!-- Onglets d'activité -->
      <div class="activity-tabs-container form-card">
        <div class="tabs-header">
          <button 
            v-for="(tab, idx) in activityTabs" 
            :key="idx"
            class="tab-btn"
            :class="{ active: activeTabIdx === idx }"
            @click="activeTabIdx = idx"
          >
            <AppIcon :name="tab.icon" :size="16" />
            <span>{{ tab.title }}</span>
          </button>
        </div>
        
        <div class="tab-content fb">
          <div class="tab-content-inner">
            <div class="tab-text-side">
              <span class="tab-num">0{{ activeTabIdx + 1 }}</span>
              <h3 class="tab-headline">{{ currentTab.title }}</h3>
              <p class="tab-desc">{{ currentTab.description }}</p>
              
              <ul class="activity-sub-list">
                <li v-for="(item, index) in currentTab.items" :key="index">
                  <span class="bullet"></span>
                  <div class="item-details">
                    <strong>{{ item.name }}</strong>
                    <span class="item-sub">{{ item.subtext }}</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div class="tab-illustration-side">
              <div class="illustration-box" :class="currentTab.theme">
                <AppIcon :name="currentTab.icon" :size="72" class="illust-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Le Mot de la Cheffe de Projet (Vidéo) ─── -->
    <section class="ap-video-section" v-reveal="280">
      <div class="video-card form-card">
        <div class="video-grid">
          <div class="video-info-side">
            <div class="fh fh-a" style="margin-bottom: 16px;">
              <div class="fh-icon"><AppIcon name="play-circle" :size="24" /></div>
              <div class="fh-title">Le Mot de la Cheffe de Projet</div>
            </div>
            <p class="vision-lead" style="margin-bottom: 16px;">
              Découvrez la vision derrière le Musée Virtuel de Guinée à travers les mots de notre Cheffe de Projet, <strong>Ida El-Majdoubi Yassir</strong>.
            </p>
            <p class="vision-text">
              Dans cette courte intervention, elle revient sur les origines du projet, les défis rencontrés sur le terrain et l'importance de la numérisation pour la préservation du patrimoine guinéen pour les générations futures.
            </p>
          </div>
          <div class="video-player-side">
            <!-- Remplacer le src="" par le lien réel de la vidéo (ex: Supabase, YouTube, Vimeo) -->
            <video 
              class="project-video" 
              controls 
              poster="/images/team/Ida.png"
              preload="none"
            >
              <!-- <source src="VOTRE_LIEN_VIDEO.mp4" type="video/mp4" /> -->
              Votre navigateur ne supporte pas la balise vidéo.
            </video>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Équipe du Projet ─── -->
    <section class="ap-team-section" v-reveal="300">
      <div class="section-title-wrap">
        <h2>Équipe de projet</h2>
        <div class="section-divider"></div>
      </div>

      <div class="team-level-card form-card">
        <div class="team-grid team-grid-lead">
          <div
            v-for="member in teamMembers.filter((item) => item.level === 1)"
            :key="member.name"
            class="team-card lead-card team-card-centered"
          >
            <div class="team-avatar">
              <img v-if="member.photo" :src="member.photo" :alt="member.name" />
              <span v-else class="team-avatar-placeholder">Photo</span>
            </div>
            <div class="team-info">
              <div class="team-name-block">
                <h3>{{ member.name }}</h3>
              </div>
              <p class="team-role">{{ member.role }}</p>
              <p>{{ member.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="team-level-card form-card">
        <div class="team-grid">
          <div
            v-for="member in teamMembers.filter((item) => item.level === 2)"
            :key="member.name"
            class="team-card"
          >
            <div class="team-avatar">
              <img v-if="member.photo" :src="member.photo" :alt="member.name" />
              <span v-else class="team-avatar-placeholder">Photo</span>
            </div>
            <div class="team-info">
              <div class="team-name-block">
                <h3>{{ member.name }}</h3>
              </div>
              <p class="team-role">{{ member.role }}</p>
              <p>{{ member.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Approche & Partenaires ─── -->
    <section class="ap-partners-section" v-reveal="320">
      <div class="section-title-wrap">
        <h2>Approche & Partenaires</h2>
        <div class="section-divider"></div>
      </div>

      <div class="partners-grid form-card">
        <div class="fb text-center py-4">
          <p class="approach-text">
            <strong>Une approche locale et collaborative :</strong> Le Musée Virtuel de Guinée s'appuie sur le renforcement des compétences locales, en associant des conservateurs, des chercheurs guinéens et de jeunes créateurs digitaux afin de pérenniser le savoir-faire numérique sur le territoire.
          </p>
          
          <div class="partners-logos-wrap">
            <div class="logo-item"><img src="/images/partenaires/ambassade-france-guinee.png" alt="Ambassade de France en Guinée" /></div>
            <div class="logo-item"><img src="/images/partenaires/expertise-france.png" alt="Expertise France" /></div>
            <div class="logo-item"><img src="/images/partenaires/musee-national-guinee.jpg" alt="Musée National de Guinée" /></div>
            <div class="logo-item"><img src="/images/partenaires/ccfg.png" alt="CCFG" /></div>
            <div class="logo-item"><img src="/images/partenaires/mcta.jpg" alt="MCTA" /></div>
          </div>

          <div class="contact-card">
            <AppIcon name="mail" :size="18" />
            <span>Pour toute information complémentaire : </span>
            <a href="mailto:musee@expertisefrance.fr" class="contact-link">musee@expertisefrance.fr</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'

const activeTabIdx = ref(0)

const teamMembers = [
  {
    name: 'Ida El-Majdoubi Yassir',
    role: 'Cheffe de projet - Expertise France',
    description: 'Coordonne la vision, les partenaires et le suivi global du projet.',
    initials: 'CP',
    photo: '/images/team/Ida.png',
    level: 1
  },
  {
    name: 'Adramet Barry',
    role: 'Expert en patrimoine et médiation culturelle - Expertise France',
    description: 'Valorise le patrimoine et structure les contenus culturels.',
    initials: 'EP',
    photo: '/images/team/Adramet.jpeg',
    level: 2
  },
  {
    name: 'Marie Jeanne Loua',
    role: 'Chargée opérationnelle - Expertise France',
    description: 'Assure le suivi quotidien et l’organisation des actions.',
    initials: 'CO',
    photo: '/images/team/MJ1.jpeg',
    level: 2
  },
  {
    name: 'Djibril Dia',
    role: 'Chargé communication et diffusion',
    description: 'Renforce la visibilité du projet et sa communication.',
    initials: 'CC',
    photo: '/images/team/DD.jpeg',
    level: 2
  },
  {
    name: 'Cheick Ahmed Thiam',
    role: 'Stagiaire assistant projet et événementiel - Expertise France',
    description: 'Appuie l’organisation des événements et des activités du projet.',
    initials: 'SA',
    photo: '/images/team/thiam.jpeg',
    level: 2
  }
]

const activityTabs = [
  {
    title: 'Collecte & Conservation',
    icon: 'search',
    theme: 'theme-or',
    description: 'Identifier les oeuvres et mener les travaux de restauration scientifique directement sur le terrain et au Musée National.',
    items: [
      { name: 'Missions de terrain', subtext: 'Enquêtes anthropologiques et collectes orales dans les différentes régions.' },
      { name: 'Captation documentaire', subtext: 'Interviews d\'artisans, enregistrements sonores et photographies HD.' },
      { name: 'Restauration physique', subtext: 'Interventions conservatoires sur les pièces de musée dégradées.' }
    ]
  },
  {
    title: 'Numérisation du Patrimoine',
    icon: 'box',
    theme: 'theme-bleu',
    description: 'Modéliser en 3D les objets rituels et documents d\'archives pour leur assurer une existence numérique éternelle.',
    items: [
      { name: 'Scan 3D d\'oeuvres', subtext: 'Acquisition photogrammétrique de masques, statuettes et objets archéologiques.' },
      { name: 'Traitement & Rendu', subtext: 'Création de fichiers 3D texturés fidèles et haute définition.' },
      { name: 'Numérisation d\'archives', subtext: 'Sauvegarde numérique des photographies anciennes et registres.' }
    ]
  },
  {
    title: 'Production de Contenus',
    icon: 'video',
    theme: 'theme-rouge',
    description: 'Rendre la culture vivante en développant des narrations immersives et des formats éducatifs contemporains.',
    items: [
      { name: 'Films documentaires', subtext: 'Création de courts-métrages sur l\'histoire des masques et rituels guinéens.' },
      { name: 'Capsules digitales', subtext: 'Contenus courts et dynamiques pour les plateformes sociales et scolaires.' },
      { name: 'Photographies éditoriales', subtext: 'Clichés artistiques mettant en valeur l\'artisanat et les arts vivants.' }
    ]
  },
  {
    title: 'Valorisation & Diffusions',
    icon: 'globe',
    theme: 'theme-vert',
    description: 'Promouvoir le patrimoine en concevant des interfaces web immersives et des événements grand public.',
    items: [
      { name: 'Plateforme digitale interactive', subtext: 'Mise en ligne des pièces numérisées avec des fiches scientifiques complètes.' },
      { name: 'Expositions & Visites 3D', subtext: 'Parcours virtuels immersifs pour explorer les galeries à distance.' },
      { name: 'Médiation culturelle', subtext: 'Organisation d\'ateliers, de conférences et d\'événements au CCFG.' }
    ]
  },
  {
    title: 'Formation & Incubation',
    icon: 'users',
    theme: 'theme-gold',
    description: 'Former la jeunesse et accompagner les acteurs culturels guinéens vers l\'appropriation des technologies créatives.',
    items: [
      { name: 'Formation des créateurs', subtext: 'Ateliers de modélisation 3D, photogrammétrie et développement web.' },
      { name: 'Programmes spécifiques', subtext: 'Initiatives comme Baxu Maam pour structurer l\'incubation technologique.' },
      { name: 'Accompagnement de projets', subtext: 'Soutien logistique et financier aux projets numériques culturels locaux.' }
    ]
  }
]

const currentTab = computed(() => activityTabs[activeTabIdx.value])
</script>

<style scoped>
.ap-wrapper {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 40px;
}

/* ─── Hero Section ─── */
.ap-hero-section {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 15px 35px rgba(89,55,22,0.15);
  margin-top: 10px;
  padding: 40px 60px;
}
.ap-hero-bg {
  position: absolute; inset: 0; z-index: 1;
}
.ap-hero-img-blur {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(30px);
  transform: scale(1.1);
  opacity: 0.9;
}
.ap-hero-img-contain {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right center;
  z-index: 1;
}
.ap-hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(26,16,8,0.8) 0%, rgba(26,16,8,0.4) 40%, rgba(89,55,22,0.1) 100%);
  backdrop-filter: blur(1px);
}
.ap-hero-content {
  position: relative; z-index: 2;
  text-align: left; color: #fff;
  max-width: 500px;
  animation: fadeInUp 0.6s ease-out;
}
.ap-hero-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 14px; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 12px;
}
.ap-hero-title {
  font-size: 2.8rem; font-weight: 900; line-height: 1.15;
  margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.5px;
}
.ap-hero-subtitle {
  font-size: 1.15rem; line-height: 1.5; opacity: 0.95;
  margin: 0; max-width: 580px; font-family: Arial, sans-serif;
}

@media (max-width: 768px) {
  .ap-hero-section {
    padding: 24px;
    min-height: 220px;
    border-radius: 16px;
    margin-top: 0;
  }
  .ap-hero-title { font-size: 1.8rem; }
  .ap-hero-subtitle { font-size: 0.9rem; }
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

/* Introduction Card */
.intro-card {
  box-shadow: var(--shadow);
}
.vision-lead {
  font-size: 1.15rem;
  line-height: 1.6;
  color: var(--brun);
  font-weight: 600;
  margin: 0 0 12px;
}
.vision-text {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
  margin: 0;
}

/* Objectives Grid */
.objectives-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}
.obj-card {
  padding: 24px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.28s, box-shadow 0.28s;
  min-height: 200px;
}
.obj-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(89,55,22,0.12);
}
.obj-num {
  position: absolute;
  top: 14px;
  right: 18px;
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--or);
  opacity: 0.12;
}
.obj-icon {
  width: 44px;
  height: 44px;
  background: rgba(132,89,54,0.08);
  color: var(--or);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.obj-card h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--brun);
  margin: 0;
}
.obj-card p {
  font-size: 0.86rem;
  line-height: 1.5;
  color: #555;
  margin: 0;
}

/* Focus: Chantier des collections */
.collections-card {
  box-shadow: var(--shadow);
  border: 1px solid rgba(132,89,54,0.15);
}
.collections-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
}
@media (max-width: 780px) {
  .collections-grid {
    grid-template-columns: 1fr;
  }
}
.collections-image-wrap {
  position: relative;
  min-height: 260px;
}
.collections-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.img-overlay-badge {
  position: absolute;
  bottom: 14px;
  left: 14px;
  background: rgba(89,55,22,0.85);
  color: #fff;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.6px;
}
.collections-info {
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
.focus-main-title {
  font-size: 1.45rem;
  font-weight: 900;
  color: var(--brun);
  margin: 6px 0 16px;
}
.collections-info p {
  font-size: 0.88rem;
  line-height: 1.55;
  color: #555;
  margin: 0 0 14px;
}
.collections-info p:last-of-type {
  margin-bottom: 20px;
}

/* Collection workflow graphics */
.collections-workflow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}
.flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
}
.flow-step span {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--brun);
}
.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(132,89,54,0.12);
  color: var(--or);
  display: flex;
  align-items: center;
  justify-content: center;
}
.flow-arrow {
  color: var(--brun);
  opacity: 0.4;
}

/* Nos Activites Tabs System */
.activity-tabs-container {
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
}
.tabs-header {
  display: flex;
  background: rgba(132,89,54,0.05);
  border-bottom: 1.5px solid rgba(132,89,54,0.12);
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}
.tabs-header::-webkit-scrollbar { display: none; } /* Chrome/Safari */

.tab-btn {
  padding: 18px 24px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--brun);
  border-bottom: 3px solid transparent;
  transition: all 0.22s;
  white-space: nowrap;
}
.tab-btn:hover {
  background: rgba(255,255,255,0.4);
  color: var(--rouge);
}
.tab-btn.active {
  border-bottom-color: var(--rouge);
  color: var(--rouge);
  background: #fff;
}

.tab-content {
  background: #fff;
}
.tab-content-inner {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 30px;
  align-items: center;
}
@media (max-width: 768px) {
  .tab-content-inner {
    grid-template-columns: 1fr;
  }
}
.tab-text-side {
  position: relative;
}
.tab-num {
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--or);
  opacity: 0.08;
  position: absolute;
  top: -18px;
  left: -5px;
}
.tab-headline {
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--brun);
  margin: 0 0 10px;
}
.tab-desc {
  font-size: 0.88rem;
  line-height: 1.5;
  color: #666;
  margin: 0 0 20px;
}

/* Activity item bullets */
.activity-sub-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.activity-sub-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.activity-sub-list .bullet {
  width: 8px;
  height: 8px;
  background: var(--rouge);
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}
.item-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.item-details strong {
  font-size: 0.86rem;
  color: var(--noir);
}
.item-details .item-sub {
  font-size: 0.78rem;
  color: #777;
}

/* Tab illustrations side */
.tab-illustration-side {
  display: flex;
  justify-content: center;
}
@media (max-width: 768px) {
  .tab-illustration-side { display: none; }
}
.illustration-box {
  width: 200px;
  height: 200px;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 15px 30px rgba(0,0,0,0.05);
}
.illustration-box::before {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 38px;
  border: 2px dashed rgba(132,89,54,0.18);
  animation: rotate-border 25s linear infinite;
}
@keyframes rotate-border {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.illustration-box.theme-or { background: rgba(132,89,54,0.08); color: var(--or); }
.illustration-box.theme-bleu { background: rgba(21,101,192,0.08); color: #1565c0; }
.illustration-box.theme-rouge { background: rgba(177,34,42,0.08); color: var(--rouge); }
.illustration-box.theme-vert { background: rgba(46,125,50,0.08); color: #2e7d32; }
.illustration-box.theme-gold { background: rgba(249,178,51,0.08); color: var(--gold); }

.illust-icon {
  animation: float 4s ease-in-out infinite;
}

/* Video Section */
.ap-video-section {
  margin-top: 20px;
}
.video-card {
  box-shadow: var(--shadow);
  border: 1px solid rgba(132,89,54,0.15);
  overflow: hidden;
}
.video-grid {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  align-items: center;
}
@media (max-width: 780px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
.video-info-side {
  padding: 40px;
}
.video-player-side {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.project-video {
  width: 100%;
  height: 100%;
  max-height: 400px;
  object-fit: cover;
  outline: none;
}

/* Team */
.ap-team-section {
  margin-top: 20px;
}
.team-level-card {
  padding: 24px;
  border-radius: 22px;
  margin-bottom: 18px;
}
.team-level-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 800;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 16px;
}
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
.team-grid-lead {
  grid-template-columns: minmax(220px, 360px);
  justify-content: center;
}
.team-card {
  background: rgba(255,255,255,0.75);
  border: 1px solid rgba(132,89,54,0.12);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  text-align: center;
}
.lead-card {
  background: linear-gradient(135deg, rgba(249,178,51,0.16), rgba(255,255,255,0.9));
}
.team-card-centered {
  justify-content: center;
  text-align: center;
  align-items: center;
}
.team-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto;
  background: linear-gradient(135deg, var(--or), var(--rouge));
  color: white;
  font-weight: 800;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  box-shadow: 0 8px 16px rgba(132,89,54,0.14);
}
.team-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.team-avatar span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.team-avatar-placeholder {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.95;
}
.team-name-block {
  margin-bottom: 4px;
}
.team-name-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--rouge);
  margin-bottom: 4px;
}
.team-info h3 {
  margin: 0 0 6px;
  font-size: 1rem;
  color: var(--brun);
}
.team-info p {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #5e4632;
}
.team-role {
  font-weight: 700;
  color: var(--or);
  margin-bottom: 4px;
}

/* Partners & Contacts */
.approach-text {
  max-width: 700px;
  margin: 0 auto 28px;
  font-size: 0.94rem;
  line-height: 1.6;
  color: var(--brun);
}
.partners-logos-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  flex-wrap: wrap;
  margin-bottom: 32px;
  padding: 10px 0;
}
.logo-item img {
  height: 54px;
  object-fit: contain;
  filter: grayscale(80%) opacity(0.7);
  transition: all 0.3s;
}
.logo-item img:hover {
  filter: grayscale(0%) opacity(1);
  transform: scale(1.06);
}

.contact-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(132,89,54,0.08);
  border: 1px solid rgba(132,89,54,0.18);
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brun);
}
.contact-link {
  color: var(--rouge);
  text-decoration: none;
}
.contact-link:hover {
  text-decoration: underline;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .ap-hero-section { padding: 30px 20px; min-height: 250px; justify-content: center; text-align: center; }
  .ap-hero-content { text-align: center; }
  .ap-hero-title { font-size: 1.8rem; }
  .vision-lead { font-size: 1rem; }
  .collections-info { padding: 20px; }
  .tab-btn { padding: 12px 14px; font-size: 0.74rem; }
  .partners-logos-wrap { gap: 20px; }
  .logo-item img { height: 38px; }
}
</style>
