import BottomNav from '@/components/BottomNav'
import HamburgerMenu from '@/components/HamburgerMenu'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[430px] mx-auto min-h-screen pb-20 relative z-10">
      <HamburgerMenu />
      {children}
      <BottomNav />
    </div>
  )
}
