import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { FileText, ExternalLink, Eye, Users, Clock, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

type LPStatus = 'draft' | 'live' | 'paused'

interface LandingPage {
  id: string
  name: string
  url: string | null
  status: LPStatus
  views: number
  submissions: number
  campaign_id: string | null
  campaign_name?: string | null
  created_at: string
}

type LandingPageRow = LandingPage & {
  campaigns?: {
    name: string | null
  } | null
}

const STATUS_CONFIG: Record<LPStatus, { label: string; color: string }> = {
  draft: { label: 'In progress', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  live: { label: 'Live', color: 'text-green-400 border-green-500/30 bg-green-500/10' },
  paused: { label: 'Paused', color: 'text-slate-400 border-white/15 bg-white/5' },
}

export default function LandingPages() {
  const { user } = useAuth()
  const [pages, setPages] = useState<LandingPage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetch() {
      const { data } = await supabase
        .from('landing_pages')
        .select('*, campaigns(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      setPages(((data ?? []) as LandingPageRow[]).map(p => ({
        ...p,
        campaign_name: p.campaigns?.name ?? null,
      })))
      setLoading(false)
    }
    fetch()
  }, [user])

  return (
    <>
      <Helmet><title>Landing Pages — LeadPilot</title></Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Landing Pages</h1>
          <p className="text-slate-400 text-sm mt-1">Pages built by our team for your campaigns</p>
        </div>

        {/* Info banner */}
        <div className="glass-blue rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText size={15} className="text-brand-400" />
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-0.5">Landing pages are built by our team</p>
            <p className="text-slate-400 text-xs leading-relaxed">
              When your campaign requires a landing page, our designers build it for you. You'll see it here once it's live.
              To request one, mention it in your campaign brief or open a support ticket.
            </p>
          </div>
        </div>

        {/* Pages */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-40 glass rounded-2xl animate-pulse" />)}
          </div>
        ) : pages.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <FileText size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No landing pages yet</p>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Once our team builds a landing page for your campaign, it will appear here with live stats.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pages.map(page => {
              const cfg = STATUS_CONFIG[page.status]
              const convRate = page.views > 0 ? ((page.submissions / page.views) * 100).toFixed(1) : '0.0'
              return (
                <div key={page.id} className="glass rounded-2xl p-5 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-brand-600/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{page.name}</p>
                        {page.campaign_name && (
                          <p className="text-slate-500 text-xs truncate">→ {page.campaign_name}</p>
                        )}
                      </div>
                    </div>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full border flex-shrink-0', cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Views', value: page.views.toLocaleString('en-IN'), icon: Eye },
                      { label: 'Leads', value: page.submissions.toLocaleString('en-IN'), icon: Users },
                      { label: 'Conv. rate', value: `${convRate}%`, icon: CheckCircle2 },
                    ].map(stat => (
                      <div key={stat.label} className="bg-dark-800/60 rounded-xl p-3 text-center">
                        <stat.icon size={14} className="text-slate-500 mx-auto mb-1" />
                        <p className="text-white font-bold text-lg">{stat.value}</p>
                        <p className="text-slate-600 text-xs">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Clock size={11} />
                      {new Date(page.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    {page.url && (
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                      >
                        Preview <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
