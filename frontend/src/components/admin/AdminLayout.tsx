import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Megaphone, CreditCard,
  LifeBuoy, LogOut, Zap, Menu, X, ChevronRight,
  Shield, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/leads', label: 'Leads', icon: Globe },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/meta', label: 'Meta Accounts', icon: Shield },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={15} className="text-white" fill="white" />
        </div>
        <div>
          <span className="font-semibold text-white">Lead<span className="text-violet-400">Pilot</span></span>
          <span className="block text-xs text-violet-400 font-medium">Admin Panel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon, exact }) => (
          <NavLink
            key={href}
            to={href}
            end={exact}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
              isActive
                ? 'bg-violet-600/15 text-white border border-violet-600/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Back to dashboard */}
      <div className="px-3 pb-2">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <ChevronRight size={16} className="rotate-180" />
          Back to dashboard
        </NavLink>
      </div>

      {/* User footer */}
      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group">
          <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-violet-200 text-xs font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{profile?.full_name ?? 'Admin'}</p>
            <p className="text-xs text-violet-400">Administrator</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-white/5 bg-dark-900/50 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 bg-dark-900 border-r border-white/5 z-50">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 flex items-center gap-4 px-4 sm:px-6 h-14 border-b border-white/5 bg-dark-950/90 backdrop-blur-xl">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex-1 flex items-center gap-2 text-sm">
            <Shield size={14} className="text-violet-400" />
            <span className="text-violet-400 font-medium">Admin</span>
          </div>
          <div className="text-xs text-slate-600 hidden sm:block">
            Logged in as <span className="text-slate-400">{profile?.email}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
