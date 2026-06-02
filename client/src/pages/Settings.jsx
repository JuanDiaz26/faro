import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { exportBackup, importBackup } from '../api/backup'

const SECTIONS = [
  {
    to: '/cards',
    icon: '💳',
    title: 'Tarjetas',
    description: 'Trackeá el próximo resumen y los cargos pendientes',
    available: true,
  },
  {
    to: '/fixed',
    icon: '🔁',
    title: 'Gastos Fijos',
    description: 'Alquiler, servicios, suscripciones — todo lo recurrente',
    available: true,
  },
  {
    to: '/budgets',
    icon: '🎯',
    title: 'Presupuestos',
    description: 'Definí límites mensuales por categoría',
    available: true,
  },
  {
    to: '/categories',
    icon: '🏷️',
    title: 'Categorías',
    description: 'Agregar, editar o borrar categorías propias',
    available: true,
  },
]

function todayStamp() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function Settings() {
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null) // { kind: 'ok'|'err', msg: '...' }

  const showToast = (kind, msg) => {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleExport = async () => {
    setBusy(true)
    try {
      const data = await exportBackup()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `eje-backup-${todayStamp()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('ok', 'Backup descargado.')
    } catch (e) {
      showToast('err', e.response?.data?.error || e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permitir volver a subir el mismo archivo
    if (!file) return

    let payload
    try {
      payload = JSON.parse(await file.text())
    } catch {
      showToast('err', 'El archivo no es un JSON válido.')
      return
    }

    const counts = payload?.data
      ? Object.entries(payload.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : '?'}`)
          .join('\n')
      : '(no se pudo leer)'

    const ok = window.confirm(
      `⚠️ Vas a REEMPLAZAR toda la base con el backup.\n\n` +
        `Archivo: ${file.name}\n` +
        `Exportado: ${payload?.exported_at || 'desconocido'}\n\n` +
        `Contenido:\n${counts}\n\n` +
        `¿Continuar?`
    )
    if (!ok) return

    setBusy(true)
    try {
      const res = await importBackup(payload)
      const total = Object.values(res.restored || {}).reduce((a, b) => a + b, 0)
      showToast('ok', `Backup restaurado (${total} registros).`)
    } catch (e) {
      showToast('err', e.response?.data?.error || e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pb-4 pt-1.5 space-y-3">
      <header className="pt-1">
        <h1 className="text-2xl font-bold text-slate-800">Más</h1>
        <p className="text-sm text-slate-500">Configuración y gestión</p>
      </header>

      <ul className="space-y-2">
        {SECTIONS.map((s) => (
          <li key={s.title}>
            <Link
              to={s.to}
              className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm active:scale-[0.99] transition-transform"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 text-2xl shrink-0">
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{s.title}</div>
                <div className="text-xs text-slate-500 truncate">{s.description}</div>
              </div>
              <span className="text-slate-300 text-xl">›</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1 mb-1.5">
          Backup
        </h2>
        <div className="rounded-2xl bg-white p-3 shadow-sm space-y-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={busy}
            className="w-full flex items-center gap-3 active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-2xl shrink-0">
              📤
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-slate-800">Exportar JSON</div>
              <div className="text-xs text-slate-500">
                Descargá un backup con todo tu historial
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full flex items-center gap-3 active:scale-[0.99] transition-transform disabled:opacity-50"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-2xl shrink-0">
              📥
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="font-semibold text-slate-800">Importar JSON</div>
              <div className="text-xs text-slate-500">
                Reemplaza todo con un backup previo
              </div>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 pt-4">
        Faro · v0.1.0
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-40 px-4 pointer-events-none">
          <div
            className={`max-w-md mx-auto rounded-2xl shadow-lg p-3 text-sm text-white ${
              toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}
    </div>
  )
}
