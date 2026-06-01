import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Inicio', icon: '📊' },
  { to: '/history', label: 'Historial', icon: '📜' },
  { to: '/savings', label: 'Ahorro', icon: '💰' },
  { to: '/debts', label: 'Deudas', icon: '💳' },
  { to: '/settings', label: 'Más', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 bg-white border-t border-slate-200">
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 text-xs transition-colors ${
                  isActive ? 'text-emerald-600 font-semibold' : 'text-slate-500'
                }`
              }
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="mt-1">{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
