import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import JoinPage from './pages/team/JoinPage'
import PlayPage from './pages/team/PlayPage'
import PresentPage from './pages/PresentPage'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import { AuthProvider } from './context/AuthContext'
import { ConfirmProvider } from './context/ConfirmContext'

export default function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <BrowserRouter basename="/askoquizet">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/play" element={<PlayPage />} />
            <Route path="/present" element={<PresentPage />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </AuthProvider>
  )
}
