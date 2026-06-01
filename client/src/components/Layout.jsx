import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-navy-50 text-slate-800">
      <div className="max-w-md mx-auto pb-28 page-enter">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
