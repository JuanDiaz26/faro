import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PWAUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      // eslint-disable-next-line no-console
      console.log('[PWA] SW registrado:', swUrl)
    },
    onRegisterError(err) {
      // eslint-disable-next-line no-console
      console.warn('[PWA] Error registrando SW:', err)
    },
  })

  if (!needRefresh && !offlineReady) return null

  const close = () => {
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 px-4 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto rounded-2xl bg-slate-800 text-white shadow-lg p-3 flex items-center gap-3">
        <span className="text-xl shrink-0">{needRefresh ? '🔄' : '✅'}</span>
        <div className="flex-1 min-w-0 text-sm">
          {needRefresh
            ? 'Hay una nueva versión disponible.'
            : 'Faro está listo para funcionar sin conexión.'}
        </div>
        {needRefresh ? (
          <button
            type="button"
            onClick={() => updateServiceWorker(true)}
            className="shrink-0 bg-beam-500 active:scale-95 transition-transform text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-beam"
          >
            Actualizar
          </button>
        ) : null}
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="shrink-0 text-slate-400 hover:text-white text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  )
}
