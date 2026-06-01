import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '../utils/format'

const OTROS_COLOR = '#94a3b8'

// Toma los top N + agrupa el resto en "Otros". Devuelve array listo para chart.
function prepareData(categories, topN = 5) {
  if (!categories || categories.length === 0) return []
  const top = categories.slice(0, topN)
  const rest = categories.slice(topN)
  if (rest.length === 0) return top
  const restTotal = rest.reduce((s, c) => s + c.total, 0)
  if (restTotal <= 0) return top
  return [
    ...top,
    {
      category_id: 'otros',
      name: 'Otros',
      icon: '📦',
      color: OTROS_COLOR,
      total: restTotal,
      count: rest.reduce((s, c) => s + c.count, 0),
    },
  ]
}

// Tooltip custom para que el monto aparezca formateado en ARS.
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-lg bg-slate-800 text-white text-xs px-2.5 py-1.5 shadow-lg">
      <div className="font-semibold">
        {item.icon} {item.name}
      </div>
      <div className="opacity-90">{formatMoney(item.total)}</div>
    </div>
  )
}

export default function SpendingChart({ categories }) {
  const data = prepareData(categories, 5)

  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Sin gastos este mes para graficar.
      </div>
    )
  }

  const total = data.reduce((s, c) => s + c.total, 0)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-800">Gastos por categoría</h2>

      <div className="mt-2 h-44 [&_*:focus]:outline-none [&_svg]:outline-none select-none">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              isAnimationActive={false}
              tabIndex={-1}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category_id}
                  fill={entry.color}
                  stroke="none"
                  tabIndex={-1}
                  style={{ outline: 'none' }}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-2 space-y-1.5">
        {data.map((c) => {
          const pct = total > 0 ? (c.total / total) * 100 : 0
          return (
            <li
              key={c.category_id}
              className="flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: c.color }}
                  aria-hidden="true"
                />
                <span className="truncate text-slate-700">
                  {c.icon} {c.name}
                </span>
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                {formatMoney(c.total)} · {Math.round(pct)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
