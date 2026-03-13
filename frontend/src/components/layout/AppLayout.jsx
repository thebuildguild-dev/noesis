import { Sidebar } from './Sidebar.jsx'
import { BottomNav } from './BottomNav.jsx'

export function AppLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">{children}</div>
      </main>
      <BottomNav />
    </div>
  )
}
