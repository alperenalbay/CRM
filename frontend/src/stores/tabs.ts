import { create } from 'zustand'

export type WorkTabKind = 'ticket' | 'task'

export interface WorkTab {
  id: string
  kind: WorkTabKind
  title: string
  recordId: number
}

interface TabsState {
  tabs: WorkTab[]
  activeTabId: string | null
  openTab: (tab: WorkTab) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string | null) => void
}

export const useTabsStore = create<TabsState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  openTab: (tab) => {
    const exists = get().tabs.some((t) => t.id === tab.id)
    if (!exists) {
      set((s) => ({ tabs: [...s.tabs, tab], activeTabId: tab.id }))
    } else {
      set({ activeTabId: tab.id })
    }
  },
  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === id)
    const next = tabs.filter((t) => t.id !== id)
    let nextActive = activeTabId
    if (activeTabId === id) {
      nextActive = next[idx]?.id ?? next[idx - 1]?.id ?? null
    }
    set({ tabs: next, activeTabId: nextActive })
  },
  setActiveTab: (id) => set({ activeTabId: id }),
}))
