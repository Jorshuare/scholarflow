import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/* Minimal inline SVG icons */
const Icon = {
  Papers:     () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
      <rect x="3" y="1.5" width="10" height="13" rx="1.5"/>
      <line x1="5.5" y1="6" x2="10.5" y2="6"/>
      <line x1="5.5" y1="9" x2="10.5" y2="9"/>
    </svg>
  ),
  Screening:  () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
      <circle cx="7" cy="7" r="4"/>
      <line x1="10.2" y1="10.2" x2="13.5" y2="13.5"/>
    </svg>
  ),
  Tags:       () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
      <path d="M2 2h5.5l5.5 5.5-5.5 5.5L2 7.5V2z"/>
      <circle cx="5.5" cy="5.5" r="1" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Prisma:     () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
      <rect x="1.5" y="9" width="3" height="5.5" rx="0.5"/>
      <rect x="6.5" y="5" width="3" height="9.5" rx="0.5"/>
      <rect x="11.5" y="1.5" width="3" height="13" rx="0.5"/>
    </svg>
  ),
  Extraction: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/>
      <line x1="1.5" y1="6" x2="14.5" y2="6"/>
      <line x1="1.5" y1="10.5" x2="14.5" y2="10.5"/>
      <line x1="6" y1="1.5" x2="6" y2="14.5"/>
    </svg>
  ),
  AI:         () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
      <path d="M8 1.5l1.5 3.5 3.5 1-2.5 2.5.7 3.8L8 10.5l-3.2 1.8.7-3.8L3 6l3.5-1z"/>
    </svg>
  ),
};

const NAV = [
  {
    label: 'LIBRARY',
    color: '#6366f1',
    links: [
      { to: 'library',             text: 'Papers',         Icon: Icon.Papers    },
      { to: 'screening',           text: 'Manual Screen',  Icon: Icon.Screening },
      { to: 'criteria',            text: 'AI Criteria',    Icon: Icon.AI        },
      { to: 'screening/results',   text: 'AI Results',     Icon: Icon.Prisma    },
      { to: 'tags',                text: 'Tags',           Icon: Icon.Tags      },
    ],
  },
  {
    label: 'ANALYSE',
    color: '#10b981',
    links: [
      { to: 'prisma',     text: 'PRISMA',      Icon: Icon.Prisma     },
      { to: 'extraction', text: 'Extraction',  Icon: Icon.Extraction },
      { to: 'ai',         text: 'AI Assistant',Icon: Icon.AI         },
    ],
  },
];

export default function Sidebar({ projectName, projectId }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-[#0F1117] border-r border-[#2A2D3A] flex flex-col">
      {/* Logo + back */}
      <div className="px-4 py-4 border-b border-[#2A2D3A]">
        <button
          onClick={() => navigate('/projects')}
          className="text-[10px] text-[#7B7F96] hover:text-[#F0F2F8] transition-colors mb-2 block"
        >
          ← All reviews
        </button>
        {/* Gradient logo */}
        <p className="text-sm font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent leading-none mb-1">
          ScholarFlow
        </p>
        <p className="text-xs text-[#F0F2F8] font-medium truncate leading-snug">{projectName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {NAV.map(section => (
          <div key={section.label}>
            <p
              className="text-[9px] font-bold tracking-widest uppercase px-2 mb-1"
              style={{ color: section.color }}
            >
              {section.label}
            </p>
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={`/projects/${projectId}/${link.to}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-[#1E2130] text-[#F0F2F8] font-medium'
                      : 'text-[#7B7F96] hover:text-[#C0C3D4] hover:bg-[#181B25]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="transition-colors"
                      style={isActive ? { color: section.color } : {}}
                    >
                      <link.Icon />
                    </span>
                    <span>{link.text}</span>
                    {isActive && (
                      <span
                        className="ml-auto w-1 h-1 rounded-full"
                        style={{ backgroundColor: section.color }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2A2D3A]">
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="text-xs text-[#7B7F96] hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
