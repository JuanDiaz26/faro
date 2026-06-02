// Placeholders animados para estados de carga. Usa animate-pulse de Tailwind.

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
}

// Lista de filas tipo tarjeta (Historial, Deudas, Gastos fijos, etc.)
export function CardListSkeleton({ rows = 4 }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm"
        >
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton className="h-3 w-16" />
        </li>
      ))}
    </ul>
  )
}

// Skeleton del Dashboard: hero + stats + bloque.
export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  )
}
