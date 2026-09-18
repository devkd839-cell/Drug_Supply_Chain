import { Navbar } from '../components/Navbar'
import { ToastContainer } from '../components/Toast'

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <ToastContainer />
    </div>
  )
}
