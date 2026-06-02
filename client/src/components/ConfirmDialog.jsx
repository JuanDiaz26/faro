import { useEffect } from 'react'
import { useUIStore } from '../store/ui'

// Diálogo de confirmación global. Montado una vez en App.
// Se dispara con useUIStore().confirm({ ... }) que devuelve una Promise<boolean>.
export default function ConfirmDialog() {
  const confirmState = useUIStore((s) => s.confirmState)
  const resolveConfirm = useUIStore((s) => s.resolveConfirm)

  useEffect(() => {
    if (!confirmState) return
    const onKey = (e) => {
      if (e.key === 'Escape') resolveConfirm(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmState, resolveConfirm])

  if (!confirmState) return null

  const {
    title = '¿Confirmás?',
    message = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false,
  } = confirmState.options || {}

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={() => resolveConfirm(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {message && (
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{message}</p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => resolveConfirm(false)}
            className="py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold active:scale-95 transition-transform"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => resolveConfirm(true)}
            className={`py-2.5 rounded-xl text-white font-semibold active:scale-95 transition-transform ${
              danger ? 'bg-rose-500' : 'bg-beam-500 shadow-beam'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
