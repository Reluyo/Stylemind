import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[430px] mx-auto min-h-screen pb-20 relative">
      {children}
      <BottomNav />
    </div>
  )
}
