import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Welcome from './pages/Welcome'
import MorningExperience from './pages/MorningExperience'
import Dashboard from './pages/Dashboard'
import Goals from './pages/Goals'
import Habits from './pages/Habits'
import Journal from './pages/Journal'
import CalendarPage from './pages/CalendarPage'
import EveningReflection from './pages/EveningReflection'
import AICoach from './pages/AICoach'
import Profile from './pages/Profile'
import Biography from './pages/Biography'
import Auth from './pages/Auth'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Navigate to="/welcome" replace />} />

          {/* Protected routes */}
          <Route path="/morning" element={<ProtectedRoute><MorningExperience /></ProtectedRoute>} />
          <Route path="/evening" element={<ProtectedRoute><EveningReflection /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><Habits /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
          <Route path="/biography" element={<ProtectedRoute><Biography /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
