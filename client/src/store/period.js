// Período (mes/año) seleccionado, compartido por Dashboard, Historial,
// Presupuestos y Ahorro. Así "estoy mirando mayo" aplica en toda la app.
import { create } from 'zustand'

const now = new Date()

export const usePeriodStore = create((set, get) => ({
  month: now.getMonth() + 1,
  year: now.getFullYear(),

  goPrev: () =>
    set((s) => {
      const d = new Date(s.year, s.month - 2, 1)
      return { month: d.getMonth() + 1, year: d.getFullYear() }
    }),

  goNext: () =>
    set((s) => {
      const d = new Date(s.year, s.month, 1)
      return { month: d.getMonth() + 1, year: d.getFullYear() }
    }),

  goToday: () => {
    const t = new Date()
    set({ month: t.getMonth() + 1, year: t.getFullYear() })
  },

  // ¿El período seleccionado es el mes actual?
  isCurrent: () => {
    const t = new Date()
    return get().month === t.getMonth() + 1 && get().year === t.getFullYear()
  },
}))
