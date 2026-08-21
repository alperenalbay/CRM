import { create } from 'zustand'

const STORAGE_KEY = 'crm_theme'

interface ThemeState {
  dark: boolean
  setDark: (dark: boolean) => void
  toggle: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  dark: localStorage.getItem(STORAGE_KEY) === 'dark',
  setDark: (dark) => {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
    set({ dark })
  },
  toggle: () => get().setDark(!get().dark),
}))
