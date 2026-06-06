import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm        from '../features/auth/LoginForm';
import RegisterForm     from '../features/auth/RegisterForm';
import ProjectList      from '../features/projects/ProjectList';
import ProjectDashboard from '../pages/ProjectDashboard';
import PaperTable       from '../features/library/PaperTable';
import ScreeningCard    from '../features/screening/ScreeningCard';
import PRISMADiagram          from '../features/prisma-diagram/PRISMADiagram';
import ChatPanel              from '../features/ai-assistant/ChatPanel';
import ExtractionTable        from '../features/extraction/ExtractionTable';
import EvidenceMatrix         from '../features/extraction/EvidenceMatrix';
import FullTextQueue          from '../features/extraction/FullTextQueue';
import TagsManager            from '../features/tags/TagsManager';
import CriteriaManager        from '../features/screening/CriteriaManager';
import AutoScreeningProgress  from '../features/screening/AutoScreeningProgress';
import ScreeningQueues        from '../features/screening/ScreeningQueues';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function Stub({ label }) {
  return <div className="p-8 text-sm text-[#7B7F96]">{label} — coming soon</div>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Navigate to="/login" replace />} />
        <Route path="/login"    element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/projects" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />

        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>}>
          <Route index              element={<Navigate to="library" replace />} />
          <Route path="library"     element={<PaperTable />} />
          <Route path="screening"             element={<ScreeningCard />} />
          <Route path="screening/progress"    element={<AutoScreeningProgress />} />
          <Route path="screening/results"     element={<ScreeningQueues />} />
          <Route path="criteria"              element={<CriteriaManager />} />
          <Route path="tags"                  element={<TagsManager />} />
          <Route path="prisma"          element={<PRISMADiagram />} />
          <Route path="extraction"      element={<ExtractionTable />} />
          <Route path="full-text-queue" element={<FullTextQueue />} />
          <Route path="evidence-matrix" element={<EvidenceMatrix />} />
          <Route path="ai"              element={<ChatPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
