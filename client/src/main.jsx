import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import { ToastProvider } from './context/ToastContext'
import AppRouter from './router/index'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <ProjectProvider>
          <AppRouter />
        </ProjectProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
