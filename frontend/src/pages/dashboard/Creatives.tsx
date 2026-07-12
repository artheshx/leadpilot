import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Image, Video, LayoutGrid, Clock, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

type CreativeType = 'image' | 'video' | 'carousel'

interface Creative {
  id: string
  name: string
  type: CreativeType
  thumbnail_url: string | null
  file_url: string | null
  campaign_id: string | null
  campaign_name?: string | null
  created_at: string
}

type CreativeRow = Creative & {
  campaigns?: {
    name: string | null
  } | null
}

const TYPE_CONFIG: Record<CreativeType, { label: string; icon: React.ElementType; color: string }> = {
  image: { label: 'Image', icon: Image, color: 'text-brand-400 bg-brand-600/10' },
  video: { label: 'Video', icon: Video, color: 'text-violet-400 bg-violet-600/10' },
  carousel: { label: 'Carousel', icon: LayoutGrid, color: 'text-amber-400 bg-amber-600/10' },
}

export default function Creatives() {
  const { user } = useAuth()
  const [creatives, setCreatives] = useState<Creative[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<CreativeType | 'all'>('all')

  useEffect(() => {
    if (!user) return
    async function fetch() {
      const { data } = await supabase
        .from('creatives')
        .select('*, campaigns(name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      setCreatives(((data ?? []) as CreativeRow[]).map(c => ({
        ...c,
        campaign_name: c.campaigns?.name ?? null,
      })))
      setLoading(false)
    }
    fetch()
  }, [user])

  const filtered = filter === 'all' ? creatives : creatives.filter(c => c.type === filter)

  return (
    <>
      <Helmet><title>Creatives — LeadPilot</title></Helmet>

      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Creatives</h1>
          <p className="text-slate-400 text-sm mt-1">Ad images, videos, and carousels built by our design team</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'image', 'video', 'carousel'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                'px-4 py-2 text-sm rounded-xl transition-all capitalize',
                filter === type
                  ? 'bg-brand-600 text-white'
                  : 'glass text-slate-400 hover:text-white'
              )}
            >
              {type === 'all' ? 'All' : TYPE_CONFIG[type].label + 's'}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-square glass rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <Image size={36} className="text-slate-700 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No creatives yet</p>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              Our design team will upload your ad creatives here once your campaign is approved.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(creative => {
              const cfg = TYPE_CONFIG[creative.type]
              const Icon = cfg.icon
              return (
                <div key={creative.id} className="glass rounded-2xl overflow-hidden group">
                  {/* Thumbnail */}
                  <div className="aspect-square bg-dark-800 flex items-center justify-center relative overflow-hidden">
                    {creative.thumbnail_url ? (
                      <img
                        src={creative.thumbnail_url}
                        alt={creative.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', cfg.color)}>
                        <Icon size={24} />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      {creative.file_url && (
                        <a
                          href={creative.file_url}
                          download
                          className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all"
                          onClick={e => e.stopPropagation()}
                        >
                          <Download size={15} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-white text-xs font-medium truncate mb-1">{creative.name}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', cfg.color)}>
                        {cfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock size={10} />
                        {new Date(creative.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {creative.campaign_name && (
                      <p className="text-slate-600 text-xs mt-1 truncate">→ {creative.campaign_name}</p>
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
