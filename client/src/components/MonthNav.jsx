import { usePeriodStore } from '../store/period'
import { monthLabel } from '../utils/format'

// Navegador de mes: ‹ Junio 2026 ›. No deja avanzar más allá del mes
// actual (no hay transacciones futuras). Muestra "Volver a hoy" si estás
// parado en un mes pasado.
export default function MonthNav() {
  const { month, year, goPrev, goNext, goToday, isCurrent } = usePeriodStore()
  const current = isCurrent()

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-2 py-1.5 shadow-sm">
      <button
        type="button"
        onClick={goPrev}
        aria-label="Mes anterior"
        className="flex items-center justify-center w-9 h-9 rounded-full text-slate-500 active:bg-slate-100 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="text-center leading-tight">
        <div className="font-semibold text-slate-800">{monthLabel(month, year)}</div>
        {!current && (
          <button
            type="button"
            onClick={goToday}
            className="text-[11px] text-beam-600 font-semibold"
          >
            Volver a hoy
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={goNext}
        disabled={current}
        aria-label="Mes siguiente"
        className="flex items-center justify-center w-9 h-9 rounded-full text-slate-500 active:bg-slate-100 transition-colors disabled:opacity-30"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
