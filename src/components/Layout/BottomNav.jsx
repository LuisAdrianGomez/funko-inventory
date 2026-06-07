import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  {
    to: '/home',
    label: 'Inicio',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/catalog',
    label: 'Catálogo',
    icon: (active) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    to: '/reports',
    label: 'Reportes',
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-6" />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Buscar',
    icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-slate-950/95 backdrop-blur border-t border-slate-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-full max-w-md mx-auto px-1">
        <NavTabButton to="/home" label="Inicio" active={isActive('/home')}>
          {tabs[0].icon(isActive('/home'))}
        </NavTabButton>

        <NavTabButton to="/catalog" label="Catálogo" active={isActive('/catalog')}>
          {tabs[1].icon(isActive('/catalog'))}
        </NavTabButton>

        <NavLink
          to="/add"
          aria-label="Agregar producto"
          className={({ isActive }) =>
            `relative -top-5 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all tap-highlight ${
              isActive
                ? 'bg-funko-orange-dark scale-95'
                : 'bg-funko-orange hover:bg-funko-orange-dark active:scale-90'
            }`
          }
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </NavLink>

        <NavTabButton to="/reports" label="Reportes" active={isActive('/reports')}>
          {tabs[2].icon(isActive('/reports'))}
        </NavTabButton>

        <NavTabButton to="/search" label="Buscar" active={isActive('/search')}>
          {tabs[3].icon(isActive('/search'))}
        </NavTabButton>
      </div>
    </nav>
  )
}

function NavTabButton({ to, label, active, children }) {
  return (
    <NavLink
      to={to}
      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors tap-highlight ${
        active ? 'text-funko-orange' : 'text-slate-500 hover:text-slate-300'
      }`}
    >
      {children}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </NavLink>
  )
}
