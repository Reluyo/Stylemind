'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Check your email</h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          If an account exists for <span className="font-medium text-stone-700">{email}</span>, we&apos;ve sent a
          password reset link. It may take a minute to arrive.
        </p>
        <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: '#AA8EA0' }}>
          Back to sign in
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Reset your password</h1>
      <p className="text-sm text-stone-500 mb-6">We&apos;ll email you a link to set a new one.</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-60 mt-2"
          style={{ background: '#AA8EA0' }}
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Remembered it?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: '#AA8EA0' }}>
          Sign in
        </Link>
      </p>
    </>
  )
}
