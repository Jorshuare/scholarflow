import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm    from '../features/auth/LoginForm';
import RegisterForm from '../features/auth/RegisterForm';
import ProjectList  from '../features/projects/ProjectList';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />

        <Route path="/projects" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />

        {/* Phase 2+ stubs */}
        <Route path="/projects/:id"            element={<ProtectedRoute><div className="p-8 text-[#7B7F96] text-sm">Dashboard — coming soon</div></ProtectedRoute>} />
        <Route path="/projects/:id/library"    element={<ProtectedRoute><div className="p-8 text-[#7B7F96] text-sm">Library — coming soon</div></ProtectedRoute>} />
        <Route path="/projects/:id/screening"  element={<ProtectedRoute><div className="p-8 text-[#7B7F96] text-sm">Screening — coming soon</div></ProtectedRoute>} />
        <Route path="/projects/:id/prisma"     element={<ProtectedRoute><div className="p-8 text-[#7B7F96] text-sm">PRISMA — coming soon</div></ProtectedRoute>} />
        <Route path="/projects/:id/ai"         element={<ProtectedRoute><div className="p-8 text-[#7B7F96] text-sm">AI Assistant — coming soon</div></ProtectedRoute>} />
        <Route path="/projects/:id/extraction" element={<ProtectedRoute><div className="p-8 text-[#7B7F96] text-sm">Extraction — coming soon</div></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
