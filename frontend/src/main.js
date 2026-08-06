import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)

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

// Directive 3D Tilt interactif pour les cartes
app.directive('tilt-3d', {
  mounted(el) {
    el.style.transformStyle = 'preserve-3d'
    el.style.perspective = '1000px'
    el.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease'

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const xc = rect.width / 2
      const yc = rect.height / 2
      const angleX = (yc - y) / 14 // intensité de rotation verticale
      const angleY = (x - xc) / 14 // intensité de rotation horizontale
      el.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale3d(1.025, 1.025, 1.025)`
    }

    const handleMouseLeave = () => {
      el.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
    }

    el.addEventListener('mousemove', handleMouseMove, { passive: true })
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    el._tiltMove = handleMouseMove
    el._tiltLeave = handleMouseLeave
  },
  unmounted(el) {
    if (el._tiltMove) el.removeEventListener('mousemove', el._tiltMove)
    if (el._tiltLeave) el.removeEventListener('mouseleave', el._tiltLeave)
  }
})

app.mount('#app')
