import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Forgot from './pages/Forgot.jsx'
import Chat from './pages/Chat.jsx'
import History from './pages/History.jsx'
import Account from './pages/Account.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/olvide" element={<Forgot />} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/historial" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/cuenta" element={<ProtectedRoute><Account /></ProtectedRoute>} />
        </Routes>
      </main>
      <footer className="foot">
        <span className="foot-brand">Fluent<span className="grad-art">AI</span></span>
        <span>© 2026 · por Francisco Nieto · React + Node.js + MongoDB</span>
      </footer>
    </>
  )
}
