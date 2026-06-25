'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { Sidebar, BottomNav } from '@/components/nav-shell'
import { ThemeToggle } from '@/components/theme-toggle'
import { SettingsSheet } from '@/components/settings-sheet'
import { DashboardView } from '@/components/views/dashboard'
import { TasksView } from '@/components/views/tasks'
import { RemindersView } from '@/components/views/reminders'
import { PlansView } from '@/components/views/plans'
import { GymView } from '@/components/views/gym'
import { FoodView } from '@/components/views/food'
import { WorkView } from '@/components/views/work'
import { AiView } from '@/components/views/ai'

export default function Home() {
  const { activeView, setActiveView } = useUIStore()
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  // Simple refresh key — bumping it forces views to reload after import
  const [refreshKey, setRefreshKey] = React.useState(0)

  // Handle PWA shortcut deep links like /?view=tasks
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view') as typeof activeView | null
    if (
      view &&
      ['dashboard', 'tasks', 'reminders', 'plans', 'gym', 'food', 'work', 'ai'].includes(view)
    ) {
      setActiveView(view)
    }
  }, [setActiveView])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Sidebar />

      {/* Top bar (mobile + desktop) */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 md:py-3 md:pl-64 bg-background/85 backdrop-blur-lg border-b border-border/50"
        style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ width: 40, height: 40 }}
            className="text-muted-foreground hover:text-foreground -ml-1 rounded-md hover:bg-accent/40 shrink-0 flex items-center justify-center"
            aria-label="Pengaturan"
          >
            <Settings className="h-5 w-5" />
          </button>
          <span className="text-base font-bold tracking-tight">
            Daily<span className="text-primary">Life</span>
          </span>
        </div>
        <div className="hidden md:flex md:items-center md:gap-3 text-sm text-muted-foreground">
          <span>Personal Manager — Self-hosted</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ width: 40, height: 40 }}
            className="text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50 shrink-0 flex items-center justify-center"
            aria-label="Pengaturan"
          >
            <Settings className="h-5 w-5" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 md:pl-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeView}-${refreshKey}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'tasks' && <TasksView />}
            {activeView === 'reminders' && <RemindersView />}
            {activeView === 'plans' && <PlansView />}
            {activeView === 'gym' && <GymView />}
            {activeView === 'food' && <FoodView />}
            {activeView === 'work' && <WorkView />}
            {activeView === 'ai' && <AiView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* Spacer for bottom nav on mobile */}
      <div className="h-16 md:hidden" aria-hidden />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  )
}
