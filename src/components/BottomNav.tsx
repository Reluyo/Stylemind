'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Shirt, Calendar, User } from 'lucide-react'

const tabs = [
  { href: '/today', label: 'Today', Icon: Home },
  { href: '/wardrobe', label: 'Wardrobe', Icon: Shirt },
  { href: '/planner', label: 'Planner', Icon: Calendar },
  { href: '/profile', label: 'Profile', Icon: User },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 flex items-center justify-around h-16 max-w-[430px] mx-auto">
      {tabs.map(({ href, label, Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${
              active ? 'text-[#C8956C]' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
