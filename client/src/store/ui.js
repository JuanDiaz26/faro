// Store de UI global: diálogos de confirmación (con Promise) y toasts.
// Reemplaza window.confirm / window.alert por componentes propios.
import { create } from 'zustand'

let toastId = 0

export const useUIStore = create((set, get) => ({
  // --- Confirmación ---
  confirmState: null, // { options, resolve } | null

  // Devuelve una Promise<boolean>. Uso: const ok = await confirm({...})
  confirm: (options) =>
    new Promise((resolve) => {
      set({ confirmState: { options, resolve } })
    }),

  resolveConfirm: (value) => {
    const cs = get().confirmState
    if (cs) cs.resolve(value)
    set({ confirmState: null })
  },

  // --- Toasts ---
  toasts: [],

  toast: (message, kind = 'ok', ms = 3500) => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, kind }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, ms)
  },
}))
