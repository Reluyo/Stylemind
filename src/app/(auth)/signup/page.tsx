'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setConfirmSent(true)
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  if (confirmSent) {
    return (
      <>
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Confirm your email</h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">
          We sent a confirmation link to <span className="font-medium text-stone-700">{email}</span>. Click it to
          activate your account, then sign in.
        </p>
        <Link href="/login" className="text-sm font-medium hover:underline" style={{ color: '#AA8EA0' }}>
          Go to sign in
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Create your account</h1>
      <p className="text-sm text-stone-500 mb-6">Start building your digital wardrobe</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
            placeholder="Alex Chen"
          />
        </div>
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
        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 pr-11 rounded-xl border border-stone-200 text-sm outline-none focus:border-[#AA8EA0] transition-colors"
              placeholder="Min. 6 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full font-medium text-white text-sm transition-all hover:opacity-90 disabled:opacity-60 mt-2"
          style={{ background: '#AA8EA0' }}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link href="/login" className="font-medium hover:underline" style={{ color: '#AA8EA0' }}>
          Sign in
        </Link>
      </p>
    </>
  )
}
