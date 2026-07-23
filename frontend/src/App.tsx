
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

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="/morning" element={<MorningExperience />} />
          <Route path="/evening" element={<EveningReflection />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/biography" element={<Biography />} />
          <Route path="/ai" element={<AICoach />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
