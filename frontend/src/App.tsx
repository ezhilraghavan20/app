import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Shell from './layouts/Shell'
import Landing     from './pages/Landing'
import Login       from './pages/Login'
import Dashboard   from './pages/Dashboard'
import BoardRoom   from './pages/BoardRoom'
import RiskRegister from './pages/RiskRegister'
import SecurityConsole from './pages/SecurityConsole'
import Incidents   from './pages/Incidents'
import Directors   from './pages/Directors'
import AuditLog    from './pages/AuditLog'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Shell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/board"     element={<BoardRoom />} />
          <Route path="/risks"     element={<RiskRegister />} />
          <Route path="/security"  element={<SecurityConsole />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/directors" element={<Directors />} />
          <Route path="/audit"     element={<AuditLog />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
