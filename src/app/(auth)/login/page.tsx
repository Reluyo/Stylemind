'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      router.push('/today')
      router.refresh()
    }
  }

  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Welcome back</h1>
      <p className="text-sm text-stone-500 mb-6">Sign in to your StyleMind account</p>

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
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#C8956C] transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#C8956C] transition-colors"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-60 mt-2"
          style={{ background: '#C8956C' }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        No account?{' '}
        <Link href="/signup" className="font-medium hover:underline" style={{ color: '#C8956C' }}>
          Create one
        </Link>
      </p>
    </>
  )
}
