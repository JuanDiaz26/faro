// Helpers de formato para mostrar plata, meses y fechas.

const ARS = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export const formatMoney = (n) => ARS.format(Number(n) || 0)

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export const formatMonth = (d = new Date()) => `${MESES[d.getMonth()]} ${d.getFullYear()}`

export const daysLeftInMonth = (d = new Date()) => {
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return lastDay - d.getDate()
}

// YYYY-MM-DD en zona local (NO usar toISOString — devuelve UTC y
// rompe la fecha cargada de noche en zonas con offset negativo).
export const isoFromDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayLocalISO = () => isoFromDate(new Date())

// Devuelve cuántos días faltan al próximo día X del mes (este mes si aún no pasó, sino el siguiente).
export const daysUntilNextDue = (dueDay, today = new Date()) => {
  if (!dueDay) return null
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let next = new Date(today.getFullYear(), today.getMonth(), dueDay)
  if (next < start) {
    next = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
  }
  return Math.round((next - start) / (1000 * 60 * 60 * 24))
}
