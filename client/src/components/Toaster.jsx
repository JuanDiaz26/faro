import { useUIStore } from '../store/ui'

// Pila de toasts global, montada una vez en App. Disparar con
// useUIStore().toast('mensaje', 'ok' | 'err').
export default function Toaster() {
  const toasts = useUIStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed inset-x-0 z-[70] px-4 pointer-events-none"
      style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-md mx-auto space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl shadow-lg p-3 text-sm text-white ${
              t.kind === 'err' ? 'bg-rose-600' : 'bg-slate-800'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
