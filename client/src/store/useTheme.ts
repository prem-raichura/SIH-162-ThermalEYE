import { create } from 'zustand'

type Mode = 'light' | 'dark'

const initial = (): Mode => (localStorage.getItem('te.theme') === 'dark' ? 'dark' : 'light')

const apply = (mode: Mode) => {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

interface ThemeState {
  mode: Mode
  toggle: () => void
}

export const useTheme = create<ThemeState>((set, get) => {
  apply(initial())
  return {
    mode: initial(),
    toggle: () => {
      const next: Mode = get().mode === 'dark' ? 'light' : 'dark'
      localStorage.setItem('te.theme', next)
      apply(next)
      set({ mode: next })
    },
  }
})
