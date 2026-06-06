import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative z-10 overflow-hidden" style={{ background: 'transparent' }}>
      {/* Decorative watermarks */}
      <div className="logo-watermark absolute -top-8 -left-8 w-48 h-64 opacity-[0.06] rotate-[-15deg]" aria-hidden="true" />
      <div className="logo-watermark absolute -bottom-8 -right-8 w-36 h-48 opacity-[0.05] rotate-[20deg]" aria-hidden="true" />
      <Link href="/" className="font-serif text-2xl font-bold mb-8" style={{ color: '#AA8EA0' }}>
        StyleMind
      </Link>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        {children}
      </div>
    </div>
  )
}
