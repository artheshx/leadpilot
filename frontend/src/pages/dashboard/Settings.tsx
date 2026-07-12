import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { CheckCircle2, User, Lock, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { cn } from '@/lib/utils'

export default function Settings() {
  const { profile, refreshProfile } = useAuth()
  const [name, setName] = useState(profile?.full_name ?? '')
  const [telegram, setTelegram] = useState(profile?.telegram ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [changingPass, setChangingPass] = useState(false)
  const [passSaved, setPassSaved] = useState(false)
  const [passError, setPassError] = useState('')

  const inputCls = cn(
    'w-full bg-dark-800 border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all'
  )

  const handleProfileSave = async () => {
    if (!name.trim()) return
    setSaving(true); setSaved(false); setSaveError('')
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name.trim(), telegram: telegram.trim() || null })
      .eq('id', profile!.id)
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    await refreshProfile()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handlePasswordChange = async () => {
    setPassError('')
    if (!newPass) { setPassError('New password is required'); return }
    if (newPass.length < 8) { setPassError('Minimum 8 characters'); return }
    if (newPass !== confirmPass) { setPassError('Passwords do not match'); return }
    setChangingPass(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setChangingPass(false)
    if (error) { setPassError(error.message); return }
    setNewPass(''); setConfirmPass('')
    setPassSaved(true)
    setTimeout(() => setPassSaved(false), 3000)
  }

  return (
    <>
      <Helmet><title>Settings — LeadPilot</title></Helmet>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account details</p>
        </div>

        {/* Profile section */}
        <div className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-brand-600/15 rounded-xl flex items-center justify-center">
              <User size={16} className="text-brand-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Profile</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address</label>
            <input type="email" value={profile?.email ?? ''} disabled className={cn(inputCls, 'opacity-50 cursor-not-allowed')} />
            <p className="mt-1 text-xs text-slate-600">Email cannot be changed. Contact support if needed.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone number</label>
            <input type="tel" value={profile?.phone ?? ''} disabled className={cn(inputCls, 'opacity-50 cursor-not-allowed')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Telegram username <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
              <input type="text" placeholder="yourusername" value={telegram} onChange={e => setTelegram(e.target.value)} className={cn(inputCls, 'pl-8')} />
            </div>
          </div>

          {/* Verification status */}
          <div className="flex gap-4">
            {[
              { label: 'Email', verified: profile?.email_verified },
              { label: 'Phone', verified: profile?.phone_verified },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <CheckCircle2 size={14} className={item.verified ? 'text-green-400' : 'text-slate-600'} />
                <span className={item.verified ? 'text-green-400' : 'text-slate-500'}>
                  {item.label} {item.verified ? 'verified' : 'not verified'}
                </span>
              </div>
            ))}
          </div>

          {saveError && <p className="text-xs text-red-400">{saveError}</p>}

          <button
            onClick={handleProfileSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
          >
            {saved ? <><CheckCircle2 size={15} /> Saved!</> : saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Password section */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-brand-600/15 rounded-xl flex items-center justify-center">
              <Lock size={16} className="text-brand-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Change password</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">New password</label>
            <input type="password" placeholder="Min. 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm new password</label>
            <input type="password" placeholder="Re-enter new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputCls} />
          </div>

          {passError && <p className="text-xs text-red-400">{passError}</p>}

          <button
            onClick={handlePasswordChange}
            disabled={changingPass}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
          >
            {passSaved ? <><CheckCircle2 size={15} /> Password updated!</> : changingPass ? 'Updating…' : 'Update password'}
          </button>
        </div>

        {/* Account info */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-brand-600/15 rounded-xl flex items-center justify-center">
              <Bell size={16} className="text-brand-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Account info</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Account type</span>
              <span className="text-white capitalize">{profile?.role ?? 'client'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Member since</span>
              <span className="text-white">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">User ID</span>
              <span className="text-slate-600 text-xs font-mono">{profile?.id?.slice(0, 16)}…</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
