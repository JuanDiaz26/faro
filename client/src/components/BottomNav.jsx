import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '/', label: 'Inicio', icon: '📊' },
  { to: '/tasks', label: 'Tareas', icon: '✅' },
  { to: '/history', label: 'Historial', icon: '📜' },
  { to: '/savings', label: 'Ahorro', icon: '💰' },
  { to: '/settings', label: 'Más', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-10 bg-white/95 backdrop-blur border-t border-slate-200"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto pt-1">
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center py-2 text-[11px] transition-colors ${
                  isActive ? 'text-beam-600 font-semibold' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-beam-500 shadow-beam"
                    />
                  )}
                  <span className={`text-xl leading-none transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {t.icon}
                  </span>
                  <span className="mt-1">{t.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
