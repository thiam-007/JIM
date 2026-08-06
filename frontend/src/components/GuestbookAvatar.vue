<template>
  <div class="gb-avatar" :class="genre || 'homme'" :style="{ width: `${size}px`, height: `${size}px` }">
    <!-- Avatar Femme -->
    <svg v-if="genre === 'femme'" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="avatar-svg">
      <circle cx="32" cy="32" r="32" fill="url(#femme-grad)" />
      <!-- Cheveux longs -->
      <path d="M18 34C18 20 22 14 32 14C42 14 46 20 46 34C46 42 44 48 44 48H20C20 48 18 42 18 34Z" fill="#3D2314" />
      <!-- Visage -->
      <circle cx="32" cy="30" r="11" fill="#E8B98A" />
      <!-- Frange/Coiffure -->
      <path d="M22 26C25 21 30 20 32 24C34 20 39 21 42 26C41 21 37 17 32 17C27 17 23 21 22 26Z" fill="#29150B" />
      <!-- Buste/Robe -->
      <path d="M16 54C16 45 23 42 32 42C41 42 48 45 48 54V64H16V54Z" fill="url(#femme-dress)" />
      <!-- Collier -->
      <path d="M28 42C28 44.2 29.8 46 32 46C34.2 46 36 44.2 36 42" stroke="#F39C12" stroke-width="2" />
      <defs>
        <linearGradient id="femme-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#845936" />
          <stop offset="1" stop-color="#D4AF37" />
        </linearGradient>
        <linearGradient id="femme-dress" x1="16" y1="42" x2="48" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#9A2A2A" />
          <stop offset="1" stop-color="#5C1717" />
        </linearGradient>
      </defs>
    </svg>

    <!-- Avatar Homme (par défaut) -->
    <svg v-else viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" class="avatar-svg">
      <circle cx="32" cy="32" r="32" fill="url(#homme-grad)" />
      <!-- Visage -->
      <circle cx="32" cy="28" r="12" fill="#DF9F6B" />
      <!-- Cheveux court -->
      <path d="M20 25C20 18 25 15 32 15C39 15 44 18 44 25C44 20 39 17 32 17C25 17 20 20 20 25Z" fill="#1C130D" />
      <!-- Chemise/Buste -->
      <path d="M14 54C14 43 22 40 32 40C42 40 50 43 50 54V64H14V54Z" fill="url(#homme-shirt)" />
      <!-- Col chemise -->
      <path d="M27 40L32 47L37 40" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round" />
      <defs>
        <linearGradient id="homme-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#3A281A" />
          <stop offset="1" stop-color="#845936" />
        </linearGradient>
        <linearGradient id="homme-shirt" x1="14" y1="40" x2="50" y2="64" gradientUnits="userSpaceOnUse">
          <stop stop-color="#1F3A5F" />
          <stop offset="1" stop-color="#0F1E33" />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  genre: { type: String, default: 'homme' },
  size: { type: [Number, String], default: 38 }
})
</script>

<style scoped>
.gb-avatar {
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 3px 10px rgba(0,0,0,0.18);
  border: 2px solid rgba(212, 175, 55, 0.4);
  overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
}

.gb-avatar:hover {
  transform: scale(1.08);
  border-color: var(--or);
}

.avatar-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
