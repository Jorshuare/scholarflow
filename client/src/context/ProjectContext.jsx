import { createContext, useContext, useState } from 'react';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [activeProject, setActiveProject] = useState(null);

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
