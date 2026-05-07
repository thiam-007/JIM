import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)

app.config.errorHandler = (err, _instance, info) => {
  console.error(`[JIM] Erreur Vue (${info}) :`, err)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('[JIM] Promesse rejetée non gérée :', event.reason)
  event.preventDefault()
})

// Scroll-reveal: elements animate in when they enter the viewport
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        revealObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.07, rootMargin: '0px 0px -32px 0px' }
)

app.directive('reveal', {
  mounted(el, binding) {
    const delay = binding.value ?? 0
    el.style.transitionDelay = `${delay}ms`
    el.classList.add('will-reveal')
    revealObserver.observe(el)
  },
  unmounted(el) {
    revealObserver.unobserve(el)
  }
})

// Ripple effect on buttons with .ripple class
function createRipple(event) {
  const button = event.currentTarget
  const existing = button.querySelector('.ripple-wave')
  if (existing) existing.remove()

  const circle = document.createElement('span')
  const diameter = Math.max(button.clientWidth, button.clientHeight)
  const rect = button.getBoundingClientRect()

  circle.classList.add('ripple-wave')
  circle.style.width = circle.style.height = `${diameter}px`
  circle.style.left = `${event.clientX - rect.left - diameter / 2}px`
  circle.style.top = `${event.clientY - rect.top - diameter / 2}px`

  button.appendChild(circle)
  circle.addEventListener('animationend', () => circle.remove())
}

app.directive('ripple', {
  mounted(el) {
    el.style.position = 'relative'
    el.style.overflow = 'hidden'
    el.addEventListener('click', createRipple)
  },
  unmounted(el) {
    el.removeEventListener('click', createRipple)
  }
})

app.mount('#app')
