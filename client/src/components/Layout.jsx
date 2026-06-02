import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-navy-50 text-slate-800">
      {/* Barra opaca fija que cubre la status bar (hora/batería) en la PWA
          instalada: el contenido scrollea POR DEBAJO de ella y nunca se ve
          chocando con el reloj. z-40 → tapa el contenido pero deja pasar
          los modales (z-50). El color matchea el tope del gradiente. */}
      <div
        aria-hidden="true"
        className="fixed top-0 inset-x-0 z-40"
        style={{ height: 'var(--safe-top)', backgroundColor: '#f8fafc' }}
      />
      {/* Empuja el contenido por debajo de la status bar al cargar. */}
      <div
        className="max-w-md mx-auto pb-28"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
