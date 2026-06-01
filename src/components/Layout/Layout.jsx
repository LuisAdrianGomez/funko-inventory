import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950">
      <Header />

      {/* Main content — padded top (header) + bottom (nav) */}
      <main className="flex-1 overflow-y-auto pt-14 pb-20 px-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
