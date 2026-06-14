import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import Create from './pages/Create.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Viewer from './pages/Viewer.jsx'

export default function App() {
  const { pathname } = useLocation()
  // The AR viewer is full-bleed (camera feed) — hide chrome there.
  const bare = pathname.startsWith('/view/')

  if (bare) {
    return (
      <Routes>
        <Route path="/view/:id" element={<Viewer />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
