// Store de categorías. Cacheado: se fetchea una vez por sesión.
// Llamar refresh() después de cualquier CRUD para invalidar.
import { create } from 'zustand'
import { getCategories } from '../api/categories'

export const useCategoriesStore = create((set, get) => ({
  categories: [],
  loading: false,
  loaded: false,
  error: null,

  fetch: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true, error: null })
    try {
      const categories = await getCategories()
      set({ categories, loaded: true })
    } catch (e) {
      set({ error: e.message || 'Error al cargar categorías' })
    } finally {
      set({ loading: false })
    }
  },

  refresh: async () => {
    set({ loading: true, error: null })
    try {
      const categories = await getCategories()
      set({ categories, loaded: true })
    } catch (e) {
      set({ error: e.message || 'Error al cargar categorías' })
    } finally {
      set({ loading: false })
    }
  },

  byType: (type) => get().categories.filter((c) => c.type === type),
}))
