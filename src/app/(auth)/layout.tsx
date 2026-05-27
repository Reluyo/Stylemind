import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ background: '#F8F5F7' }}>
      <Link href="/" className="font-serif text-2xl font-bold mb-8" style={{ color: '#AA8EA0' }}>
        StyleMind
      </Link>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-8">
        {children}
      </div>
    </div>
  )
}
