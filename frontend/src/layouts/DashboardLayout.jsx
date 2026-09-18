import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'
import { ToastContainer } from '../components/Toast'

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar
        onMenuClick={() => setSidebarOpen(o => !o)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
