import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-navy-50 text-slate-800">
      {/* Sin viewport-fit=cover, iOS/Android reservan la status bar y el
          home indicator automáticamente: el contenido nunca scrollea por
          debajo de la hora/batería. Los env(safe-area-*) quedan como
          fallback inofensivo (0 cuando no hay cover). */}
      <div className="max-w-md mx-auto pb-28">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
