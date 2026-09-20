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
