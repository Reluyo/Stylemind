'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, Home, Shirt, Calendar, User, Luggage, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/today', label: 'Today', Icon: Home },
  { href: '/wardrobe', label: 'Wardrobe', Icon: Shirt },
  { href: '/planner', label: 'Week Planner', Icon: Calendar },
  { href: '/trip-planner', label: 'Trip Planner', Icon: Luggage },
  { href: '/profile', label: 'Profile', Icon: User },
]

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
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 z-50 p-2 rounded-full bg-white/85 backdrop-blur-sm border border-stone-200 shadow-sm hover:bg-white transition-all"
        style={{ right: 'max(1rem, calc(50vw - 215px + 1rem))' }}
        aria-label="Open menu"
      >
        <Menu size={18} className="text-stone-600" />
      </button>

      {/* Backdrop + panel */}
      {open && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setOpen(false)}
        >
          {/* Dim overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />

          {/* Slide-in panel */}
          <div
            className="absolute top-0 right-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
              <span className="font-serif text-xl font-bold" style={{ color: '#AA8EA0' }}>
                StyleMind
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 transition-colors"
              >
                <X size={18} className="text-stone-500" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, Icon }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      active
                        ? 'text-white'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                    style={active ? { background: '#AA8EA0' } : {}}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                    {label}
                    {href === '/trip-planner' && (
                      <span
                        className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: '#EDE8F5', color: '#725265' }}
                      >
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
