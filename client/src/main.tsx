import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Hand off from the inline boot screen in index.html.
 *
 * Two frames, not one: the first lets React commit, the second lets the browser paint that
 * commit before the boot screen starts fading, so there is never a flash of empty paper
 * between the two. It leaves on a fade rather than a cut, and takes itself out of the DOM
 * afterwards so it can never trap a click or a screen reader.
 */
/**
 * A deploy replaces every hashed chunk, but an already-open tab still holds the old index and
 * asks for filenames that no longer exist. The SPA rewrite answers those with index.html, so
 * the browser reports a module served as text/html and the navigation dies.
 *
 * Vite raises `vite:preloadError` for exactly this. One reload picks up the current build.
 * The stamp guards against a reload loop if the failure is something else entirely.
 */
window.addEventListener('vite:preloadError', (event) => {
  const key = 'te.reloadedAt'
  const last = Number(sessionStorage.getItem(key) ?? 0)
  if (Date.now() - last < 10_000) return
  event.preventDefault()
  sessionStorage.setItem(key, String(Date.now()))
  window.location.reload()
})

const boot = document.getElementById('boot')
if (boot) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      boot.dataset.leaving = 'true'
      boot.addEventListener('transitionend', () => boot.remove(), { once: true })
      // A belt-and-braces removal: if the transition never fires (reduced motion cancels it),
      // the boot screen must still go.
      window.setTimeout(() => boot.remove(), 600)
    }),
  )
}
