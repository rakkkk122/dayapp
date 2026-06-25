'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ViewKey =
  | 'dashboard'
  | 'tasks'
  | 'reminders'
  | 'plans'
  | 'gym'
  | 'food'
  | 'work'
  | 'ai'

interface UIState {
  activeView: ViewKey
  setActiveView: (v: ViewKey) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeView: 'dashboard',
      setActiveView: (v) => set({ activeView: v }),
    }),
    { name: 'dailylife-ui' }
  )
)
