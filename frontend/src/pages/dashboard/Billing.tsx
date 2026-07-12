import { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CreditCard, Plus, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle2, XCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

type TxnType = 'add_funds' | 'spend'
type TxnStatus = 'pending' | 'confirmed' | 'failed'

interface Transaction {
  id: string
  amount: number
  type: TxnType
  status: TxnStatus
  note: string | null
  created_at: string
}

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000]

const STATUS_CONFIG: Record<TxnStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'text-green-400 border-green-500/30 bg-green-500/10', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-400 border-red-500/30 bg-red-500/10', icon: XCircle },
}

export default function Billing() {
  const { user } = useAuth()
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [amountError, setAmountError] = useState('')

  const fetchTxns = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTxns(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTxns() }, [fetchTxns])

  // Compute balance from confirmed txns
  const balance = txns
    .filter(t => t.status === 'confirmed')
    .reduce((acc, t) => t.type === 'add_funds' ? acc + t.amount : acc - t.amount, 0)

  const totalSpent = txns
    .filter(t => t.status === 'confirmed' && t.type === 'spend')
    .reduce((acc, t) => acc + t.amount, 0)

  const handleAddFunds = async () => {
    const amount = selectedAmount ?? Number(customAmount)
    if (!amount || amount < 500) { setAmountError('Minimum amount is ₹500'); return }
    if (amount > 500000) { setAmountError('Maximum amount is ₹5,00,000 per transaction'); return }
    if (!user) return

    setSubmitting(true)
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      amount,
      type: 'add_funds',
      status: 'pending',
      note: `Add funds request — ₹${amount.toLocaleString('en-IN')}`,
    })
    setSubmitting(false)

    if (!error) {
      setShowModal(false)
      setSelectedAmount(null)
      setCustomAmount('')
      fetchTxns()
    }
  }

  const finalAmount = selectedAmount ?? (customAmount ? Number(customAmount) : null)

  return (
    <>
      <Helmet><title>Billing — LeadPilot</title></Helmet>

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your wallet and view transaction history</p>
        </div>

        {/* Balance cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Wallet balance', value: `₹${balance.toLocaleString('en-IN')}`, color: 'text-green-400', sub: 'Available to spend' },
            { label: 'Total spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-brand-400', sub: 'Across all campaigns' },
            { label: 'Pending', value: `₹${txns.filter(t=>t.status==='pending'&&t.type==='add_funds').reduce((a,t)=>a+t.amount,0).toLocaleString('en-IN')}`, color: 'text-amber-400', sub: 'Awaiting confirmation' },
          ].map(card => (
            <div key={card.label} className="glass rounded-2xl p-5">
              <p className="text-slate-500 text-xs mb-2">{card.label}</p>
              <p className={cn('text-3xl font-bold mb-1', card.color)}>{card.value}</p>
              <p className="text-slate-600 text-xs">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Add funds banner */}
        <div className="glass rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-white font-semibold mb-1">Add funds to your wallet</p>
            <p className="text-slate-400 text-sm">
              Your ad spend is deducted from your wallet. Add funds via UPI / bank transfer and our team confirms within 2 hours.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all flex-shrink-0"
          >
            <Plus size={15} /> Add funds
          </button>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Transaction history</h2>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 glass rounded-xl animate-pulse" />)}
            </div>
          ) : txns.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <CreditCard size={32} className="text-slate-700 mx-auto mb-3" />
              <p className="text-white font-semibold mb-1">No transactions yet</p>
              <p className="text-slate-500 text-sm">Add funds to get started</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden divide-y divide-white/5">
              {txns.map(txn => {
                const cfg = STATUS_CONFIG[txn.status]
                const StatusIcon = cfg.icon
                const isCredit = txn.type === 'add_funds'
                return (
                  <div key={txn.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-all">
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                      isCredit ? 'bg-green-600/10' : 'bg-red-600/10'
                    )}>
                      {isCredit
                        ? <ArrowDownCircle size={18} className="text-green-400" />
                        : <ArrowUpCircle size={18} className="text-red-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        {isCredit ? 'Funds added' : 'Ad spend'}
                      </p>
                      <p className="text-slate-500 text-xs truncate">
                        {txn.note ?? '—'} · {new Date(txn.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-sm font-semibold', isCredit ? 'text-green-400' : 'text-red-400')}>
                        {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                      </p>
                      <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1', cfg.color)}>
                        <StatusIcon size={10} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add funds modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative glass rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add funds</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>

            <div className="space-y-5">
              {/* Quick amounts */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Select amount</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_AMOUNTS.map(amt => (
                    <button
                      key={amt}
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); setAmountError('') }}
                      className={cn(
                        'py-3 rounded-xl text-sm font-medium transition-all',
                        selectedAmount === amt
                          ? 'bg-brand-600 text-white'
                          : 'glass text-slate-300 hover:text-white hover:border-white/20'
                      )}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1.5">Or enter custom amount</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input
                    type="number"
                    placeholder="Minimum ₹500"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); setAmountError('') }}
                    className="w-full bg-dark-800 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                {amountError && <p className="mt-1 text-xs text-red-400">{amountError}</p>}
              </div>

              {/* Payment info */}
              <div className="bg-dark-800/60 rounded-xl p-4 text-xs text-slate-400 space-y-1">
                <p className="text-white text-sm font-medium mb-2">Payment instructions</p>
                <p>UPI ID: <span className="text-white font-medium">leadpilot@upi</span></p>
                <p>Bank: HDFC Bank · A/C: 1234567890 · IFSC: HDFC0001234</p>
                <p className="text-slate-600 mt-2">After payment, submit this request and share your UTR in support if needed. Funds are confirmed within 2 business hours.</p>
              </div>

              {finalAmount && finalAmount >= 500 && (
                <div className="bg-brand-600/10 border border-brand-600/20 rounded-xl p-3 text-sm text-brand-300">
                  Adding <strong>₹{finalAmount.toLocaleString('en-IN')}</strong> to your wallet
                </div>
              )}

              <button
                onClick={handleAddFunds}
                disabled={submitting || !finalAmount}
                className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-all"
              >
                {submitting ? 'Submitting request…' : 'Submit add-funds request →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
