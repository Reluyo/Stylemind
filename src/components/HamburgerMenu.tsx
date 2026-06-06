'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Home, Calendar, User, Luggage, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { DressFormIcon } from '@/components/BottomNav'

const NAV_ITEMS = [
  { href: '/today', label: 'Today', icon: 'home' },
  { href: '/wardrobe', label: 'Wardrobe', icon: 'dress' },
  { href: '/planner', label: 'Week Planner', icon: 'calendar' },
  { href: '/trip-planner', label: 'Trip Planner', icon: 'luggage' },
  { href: '/profile', label: 'Profile', icon: 'user' },
] as const

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 z-50 p-2 rounded-full bg-white/85 backdrop-blur-sm border border-stone-200 shadow-sm hover:bg-white transition-all"
        style={{ right: 'max(1rem, calc(50vw - 215px + 1rem))' }}
        aria-label="Open menu"
      >
        <Menu size={18} className="text-stone-600" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />

          <div
            className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header with logo */}
            <div className="relative flex items-center justify-between px-6 py-5 border-b border-stone-100 overflow-hidden">
              {/* Watermark dress form */}
              <div className="absolute -right-2 -bottom-4 opacity-10 pointer-events-none">
                <DressFormIcon size={80} color="#725265" strokeWidth={6} />
              </div>
              <Image src="/logo-wordmark.png" alt="StyleMind" width={130} height={50} className="object-contain" />
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 transition-colors relative z-10"
              >
                <X size={18} className="text-stone-500" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon }) => {
                const active = pathname.startsWith(href)
                const iconColor = active ? 'white' : '#725265'
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      active ? 'text-white' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                    style={active ? { background: '#AA8EA0' } : {}}
                  >
                    {icon === 'home' && <Home size={18} strokeWidth={active ? 2.5 : 1.8} color={iconColor} />}
                    {icon === 'dress' && <DressFormIcon size={18} color={iconColor} strokeWidth={active ? 7 : 6} />}
                    {icon === 'calendar' && <Calendar size={18} strokeWidth={active ? 2.5 : 1.8} color={iconColor} />}
                    {icon === 'luggage' && <Luggage size={18} strokeWidth={active ? 2.5 : 1.8} color={iconColor} />}
                    {icon === 'user' && <User size={18} strokeWidth={active ? 2.5 : 1.8} color={iconColor} />}
                    {label}
                    {href === '/trip-planner' && (
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#EDE8F5', color: '#725265' }}>
                        NEW
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Sign out */}
            <div className="px-4 pb-8 pt-2 border-t border-stone-100">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-500 hover:bg-stone-50 transition-all"
              >
                <LogOut size={18} strokeWidth={1.8} />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
