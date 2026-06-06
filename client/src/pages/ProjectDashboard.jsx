import { useEffect, useState } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getProject } from '../services/projects.service';

export default function ProjectDashboard() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F8] flex items-center justify-center">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  );

  if (error) return <Navigate to="/projects" replace />;

  return (
    <div className="flex min-h-screen bg-[#F0F2F8]">
      <Sidebar projectName={project.name} projectId={id} />
      <main className="flex-1 overflow-auto">
        <Outlet context={{ project }} />
      </main>
    </div>
  );
}
