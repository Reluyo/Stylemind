'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, CheckCircle } from 'lucide-react'

export default function UpgradeSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.push('/today'), 4000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      style={{ background: '#F5EEF3' }}>
      <div className="logo-watermark absolute -top-10 -left-10 w-52 h-64 opacity-[0.07] rotate-[-20deg]" aria-hidden="true" />
      <div className="logo-watermark absolute -bottom-10 -right-10 w-44 h-56 opacity-[0.06] rotate-[15deg]" aria-hidden="true" />
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, #AA8EA0, #725265)' }}>
        <Sparkles size={36} className="text-white" />
      </div>
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-3">Welcome to Pro!</h1>
      <p className="text-stone-500 text-sm leading-relaxed max-w-xs mb-8">
        You now have unlimited wardrobe items, 5 daily outfits, AI Stylist chat, the week planner, and outfit visualization.
      </p>
      <div className="space-y-2 text-left w-full max-w-xs">
        {[
          'Unlimited wardrobe items',
          '5 AI outfit suggestions daily',
          'AI Stylist chat',
          'Week & trip planner',
          'Outfit try-on visualization',
        ].map((f) => (
          <div key={f} className="flex items-center gap-2">
            <CheckCircle size={16} style={{ color: '#AA8EA0' }} />
            <span className="text-sm text-stone-700">{f}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-400 mt-8">Redirecting you to your outfits…</p>
    </div>
  )
}
