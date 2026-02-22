import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import './index.css'
import Login from './Pages/Login'
import Repos from './Pages/Repos'
import AuthProvider from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider>
          <Router basename="/VigilCI">
              <Routes>
                  <Route path={""} element={<Login />} />
                  <Route path="/repos" element={
                      <ProtectedRoute>
                          <Repos />
                      </ProtectedRoute>
                  } />
              </Routes>
          </Router>
      </AuthProvider>
  </StrictMode>,
)
