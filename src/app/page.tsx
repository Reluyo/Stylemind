import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF7F4' }}>
      {/* Header */}
      <header className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="font-serif text-xl font-bold" style={{ color: '#C8956C' }}>StyleMind</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium px-4 py-2 rounded-full text-white transition-all hover:opacity-90"
            style={{ background: '#C8956C' }}
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6"
          style={{ background: '#F5EDE6', color: '#8B5E3C' }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#C8956C' }} />
          AI-powered outfit planning
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-stone-900 leading-tight mb-6">
          Your wardrobe,<br />
          <span style={{ color: '#C8956C' }}>curated daily</span>
        </h1>
        <p className="text-stone-500 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          StyleMind knows your wardrobe, reads the weather, and suggests five polished outfits every morning — so you never waste time getting dressed again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="px-8 py-3.5 rounded-full text-white font-medium text-base shadow-md hover:opacity-90 transition-all"
            style={{ background: '#C8956C' }}
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="px-8 py-3.5 rounded-full font-medium text-base border border-stone-200 text-stone-700 hover:border-stone-400 transition-all bg-white"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="font-serif text-3xl font-bold text-center text-stone-900 mb-12">
          Everything you need to dress well
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: 'Weather-aware styling',
              desc: 'Outfits matched to the day\'s forecast — light layers for spring breezes, cozy picks for cold fronts.',
              icon: '☁️',
            },
            {
              title: 'AI Stylist chat',
              desc: 'Ask StyleMind to swap a piece, change the vibe, or plan for a special occasion. It knows your wardrobe.',
              icon: '✨',
            },
            {
              title: 'Week planner',
              desc: 'Generate a full Mon–Fri outfit plan in one tap. No repeat looks, always weather-appropriate.',
              icon: '📅',
            },
          ].map(({ title, desc, icon }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white border border-stone-100 shadow-sm"
            >
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="font-serif text-lg font-semibold text-stone-900 mb-2">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="font-serif text-3xl font-bold text-center text-stone-900 mb-3">Simple pricing</h2>
        <p className="text-center text-stone-500 mb-12">Start free. Upgrade when you want more.</p>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free */}
          <div className="p-8 rounded-2xl bg-white border border-stone-200">
            <div className="font-serif text-xl font-bold text-stone-900 mb-1">Free</div>
            <div className="text-3xl font-bold text-stone-900 mb-6">$0</div>
            <ul className="space-y-3 text-sm text-stone-600 mb-8">
              {[
                'Up to 30 wardrobe items',
                '3 daily outfit suggestions',
                'Weather-aware recommendations',
                'Manual wardrobe management',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span style={{ color: '#C8956C' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center w-full py-3 rounded-full font-medium border border-stone-200 text-stone-700 hover:border-stone-400 transition-all text-sm"
            >
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div
            className="p-8 rounded-2xl border-2 relative overflow-hidden"
            style={{ borderColor: '#C8956C', background: '#FDF9F6' }}
          >
            <div
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full text-white"
              style={{ background: '#C8956C' }}
            >
              POPULAR
            </div>
            <div className="font-serif text-xl font-bold text-stone-900 mb-1">Pro</div>
            <div className="text-3xl font-bold text-stone-900 mb-6">
              $9<span className="text-base font-normal text-stone-400">/mo</span>
            </div>
            <ul className="space-y-3 text-sm text-stone-600 mb-8">
              {[
                'Unlimited wardrobe items',
                '5 daily outfit suggestions',
                'AI Stylist chat',
                'Full week planner',
                'AI try-on images',
                'Morning outfit reminders',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span style={{ color: '#C8956C' }}>✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center w-full py-3 rounded-full font-medium text-white transition-all text-sm hover:opacity-90"
              style={{ background: '#C8956C' }}
            >
              Start Pro free for 7 days
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-100 py-8 text-center text-sm text-stone-400">
        <span className="font-serif font-semibold" style={{ color: '#C8956C' }}>StyleMind</span>
        {' '}· Your AI personal stylist · © 2025
      </footer>
    </div>
  )
}
