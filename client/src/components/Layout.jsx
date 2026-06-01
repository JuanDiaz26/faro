import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-navy-50 text-slate-800">
      {/* Franja opaca que cubre la status bar (hora/batería) al scrollear,
          para que el contenido no se vea por debajo del notch/Dynamic Island. */}
      <div
        aria-hidden="true"
        className="fixed top-0 inset-x-0 z-30 bg-slate-50"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />
      <div className="max-w-md mx-auto pb-28 page-enter">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
