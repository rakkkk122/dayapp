'use client'

import { useEffect } from 'react'

/**
 * Service Worker registration.
 * IMPORTANT: SW hanya di-register di PRODUCTION.
 * Di dev mode, SW bisa cache chunk JS yang berubah-ubah setiap rebuild,
 * menyebabkan error "_interop_require_wildcard is not a function"
 * karena browser load chunk lama dari cache SW padahal dev server sudah update.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // SKIP di development — SW cache bermasalah dengan webpack dev hot reload
    if (process.env.NODE_ENV === 'development') {
      // Unregister SW yang mungkin terpasang dari sesi production sebelumnya
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          reg.unregister().then(() => {
            console.info('[SW] Unregistered in dev mode')
          })
        })
      })
      return
    }

    // PRODUCTION: register SW
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing
            if (!nw) return
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                nw.postMessage('SKIP_WAITING')
              }
            })
          })
        })
        .catch((err) => {
          console.warn('[SW] registration failed:', err)
        })
    }
    if (document.readyState === 'complete') {
      register()
    } else {
      window.addEventListener('load', register, { once: true })
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
