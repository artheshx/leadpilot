import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Megaphone, Users, CreditCard, TrendingUp,
  ArrowRight, Plus, ArrowUpRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

interface Stats {
  activeCampaigns: number
  totalLeads: number
  totalSpent: number
  balance: number
}

interface RecentLead {
  id: string
  name: string
  phone: string
  campaign_name: string
  created_at: string
  status: string
}

type RecentLeadRow = Omit<RecentLead, 'campaign_name'> & {
  campaigns?: {
    name: string | null
  } | { name: string | null }[] | null
}

export default function DashboardOverview() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ activeCampaigns: 0, totalLeads: 0, totalSpent: 0, balance: 0 })
  const [leads, setLeads] = useState<RecentLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchData() {
      // Active campaigns
      const { count: campCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'active')

      // Total leads
      const { count: leadCount } = await supabase
        .from('leads')
        .select('campaigns!inner(user_id)', { count: 'exact', head: true })
        .eq('campaigns.user_id', user!.id)

      // Balance & spent
      const { data: txns } = await supabase
        .from('transactions')
        .select('amount, type, status')
        .eq('user_id', user!.id)
        .eq('status', 'confirmed')

      let balance = 0, totalSpent = 0
      txns?.forEach(t => {
        if (t.type === 'add_funds') balance += t.amount
        if (t.type === 'spend') { balance -= t.amount; totalSpent += t.amount }
      })

      // Recent leads
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, name, phone, status, created_at, campaigns!inner(name, user_id)')
        .eq('campaigns.user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        activeCampaigns: campCount ?? 0,
        totalLeads: leadCount ?? 0,
        totalSpent,
        balance,
      })

      setLeads(((recentLeads ?? []) as RecentLeadRow[]).map(l => {
        const campaign = Array.isArray(l.campaigns) ? l.campaigns[0] : l.campaigns
        return {
          id: l.id,
          name: l.name,
          phone: l.phone,
          status: l.status,
          created_at: l.created_at,
          campaign_name: campaign?.name ?? '—',
        }
      }))

      setLoading(false)
    }
    fetchData()
  }, [user])

  const statCards = [
    { label: 'Active campaigns', value: stats.activeCampaigns, icon: Megaphone, color: 'text-brand-400', bg: 'bg-brand-600/10', href: '/dashboard/campaigns' },
    { label: 'Total leads', value: stats.totalLeads, icon: Users, color: 'text-green-400', bg: 'bg-green-600/10', href: '/dashboard/leads' },
    { label: 'Total spent', value: `₹${stats.totalSpent.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-600/10', href: '/dashboard/billing' },
    { label: 'Wallet balance', value: `₹${stats.balance.toLocaleString('en-IN')}`, icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-600/10', href: '/dashboard/billing' },
  ]

  const quickLinks = [
    { label: 'New campaign', href: '/dashboard/campaigns', icon: Megaphone, desc: 'Brief us on a new campaign' },
    { label: 'View leads', href: '/dashboard/leads', icon: Users, desc: 'See all your leads' },
    { label: 'Add funds', href: '/dashboard/billing', icon: CreditCard, desc: 'Top up your wallet' },
  ]

  return (
    <>
      <Helmet><title>Dashboard — LeadPilot</title></Helmet>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Overview</h1>
            <p className="text-slate-400 text-sm mt-1">Welcome back! Here's what's happening.</p>
          </div>
          <Link
            to="/dashboard/campaigns"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus size={15} />
            New campaign
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => (
            <Link key={card.label} to={card.href} className="glass rounded-2xl p-5 hover:border-white/15 transition-all group">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', card.bg)}>
                <card.icon size={17} className={card.color} />
              </div>
              <p className="text-slate-500 text-xs mb-1">{card.label}</p>
              {loading
                ? <div className="h-7 w-16 bg-white/5 rounded animate-pulse" />
                : <p className="text-2xl font-bold text-white">{card.value}</p>
              }
              <ArrowUpRight size={14} className="text-slate-600 mt-2 group-hover:text-slate-400 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Two-col layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent leads */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Recent leads</h2>
              <Link to="/dashboard/leads" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-10">
                <Users size={28} className="text-slate-700 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No leads yet</p>
                <p className="text-slate-600 text-xs mt-1">Leads appear here once your campaign is live</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leads.map(lead => (
                  <div key={lead.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
                    <div className="w-8 h-8 rounded-full bg-brand-700/40 flex items-center justify-center text-brand-300 text-xs font-bold flex-shrink-0">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-slate-500 text-xs">{lead.phone} · {lead.campaign_name}</p>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border flex-shrink-0',
                      lead.status === 'new' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                      lead.status === 'contacted' ? 'text-brand-400 border-brand-500/30 bg-brand-500/10' :
                      'text-slate-400 border-white/10 bg-white/5'
                    )}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Quick actions</h2>
            {quickLinks.map(link => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center gap-4 glass rounded-xl p-4 hover:border-white/15 transition-all group"
              >
                <div className="w-9 h-9 bg-brand-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <link.icon size={17} className="text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{link.label}</p>
                  <p className="text-slate-500 text-xs">{link.desc}</p>
                </div>
                <ArrowRight size={15} className="text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// cn helper needed locally
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}
