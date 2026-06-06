'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, User } from 'lucide-react'

export function DressFormIcon({ size = 20, color = '#a8a29e', strokeWidth = 6 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 18 C100 18 100 8 110 8 C120 8 122 18 115 22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M115 22 C112 26 108 30 103 33" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M103 33 C98 36 92 40 88 46" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M97 33 C102 36 108 40 112 46" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M88 46 C72 52 55 62 50 80 C46 94 52 104 58 112 C66 122 78 128 80 136 C82 142 80 148 78 152" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M112 46 C128 52 145 62 150 80 C154 94 148 104 142 112 C134 122 122 128 120 136 C118 142 120 148 122 152" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M78 152 C68 156 55 158 48 165 C44 169 46 174 52 175" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M122 152 C132 156 145 158 152 165 C156 169 154 174 148 175" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M52 175 C50 185 50 200 52 215 C54 228 62 238 70 242" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M148 175 C150 185 150 200 148 215 C146 228 138 238 130 242" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M70 242 C85 246 115 246 130 242" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M100 72 L103 85 L116 88 L103 91 L100 104 L97 91 L84 88 L97 85 Z" fill={color}/>
    </svg>
  )
}

const tabs = [
  { href: '/today', label: 'Today', icon: 'home' },
  { href: '/wardrobe', label: 'Wardrobe', icon: 'dress' },
  { href: '/planner', label: 'Planner', icon: 'calendar' },
  { href: '/profile', label: 'Profile', icon: 'user' },
] as const

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100 flex items-center justify-around h-16 max-w-[430px] mx-auto">
      {tabs.map(({ href, label, icon }) => {
        const active = path.startsWith(href)
        const color = active ? '#AA8EA0' : '#a8a29e'
        const sw = active ? 2.5 : 1.5
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 text-xs font-medium transition-colors ${
              active ? 'text-[#AA8EA0]' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {icon === 'home' && <Home size={22} strokeWidth={sw} color={color} />}
            {icon === 'dress' && <DressFormIcon size={22} color={color} strokeWidth={active ? 7 : 6} />}
            {icon === 'calendar' && <Calendar size={22} strokeWidth={sw} color={color} />}
            {icon === 'user' && <User size={22} strokeWidth={sw} color={color} />}
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
