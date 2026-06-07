import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
  Notes:      () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
      <rect x="2" y="1.5" width="12" height="13" rx="1.5"/>
      <line x1="4.5" y1="5.5" x2="11.5" y2="5.5" strokeLinecap="round"/>
      <line x1="4.5" y1="8"   x2="11.5" y2="8"   strokeLinecap="round"/>
      <line x1="4.5" y1="10.5" x2="8"   y2="10.5" strokeLinecap="round"/>
    </svg>
  ),
};

const HomeIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0">
    <path d="M2 7L8 2l6 5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.5 6.5V13.5h3.5V10h2v3.5h3.5V6.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NAV = [
  {
    label: 'LIBRARY',
    color: '#C8A951',
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
    color: '#C8A951',
    links: [
      { to: 'prisma',          text: 'PRISMA',          Icon: Icon.Prisma     },
      { to: 'full-text-queue', text: 'Full-Text Queue', Icon: Icon.Papers     },
      { to: 'evidence-matrix', text: 'Evidence Matrix', Icon: Icon.Extraction },
      { to: 'ai',              text: 'AI Assistant',    Icon: Icon.AI         },
      { to: 'notes',           text: 'Notes',           Icon: Icon.Notes      },
    ],
  },
];

const MIN_W     = 48;
const MAX_W     = 360;
const DEFAULT_W = 180;

export default function Sidebar({ projectName, projectId }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('sf_sidebar_width_v2');
    if (!saved) return DEFAULT_W;
    const n = parseInt(saved, 10);
    return Number.isFinite(n) ? Math.min(MAX_W, Math.max(MIN_W, n)) : DEFAULT_W;
  });

  const isDragging = useRef(false);
  const startX     = useRef(0);
  const startW     = useRef(0);

  useEffect(() => {
    localStorage.setItem('sf_sidebar_width_v2', width);
  }, [width]);

  function handleDragStart(e) {
    e.preventDefault();
    isDragging.current = true;
    startX.current     = e.clientX;
    startW.current     = width;

    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMove(e) {
      if (!isDragging.current) return;
      const next = Math.min(MAX_W, Math.max(MIN_W, startW.current + (e.clientX - startX.current)));
      setWidth(next);
    }

    function onUp() {
      isDragging.current          = false;
      document.body.style.cursor  = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',   onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',   onUp);
  }

  const iconOnly = width < 72;   // 48–71px: centred icons, no text at all
  const compact  = width < 130;  // 72–129px: icons + truncated labels, no section headings

  return (
    <aside
      style={{ width }}
      className="shrink-0 relative h-screen sticky top-0 bg-[#002868] border-r border-[#003580] flex flex-col transition-none"
    >
      {/* Logo + back */}
      <div className={`border-b border-[#003580] overflow-hidden ${iconOnly ? 'px-1 py-3 flex flex-col items-center' : 'px-4 py-4'}`}>
        <button
          onClick={() => navigate('/projects')}
          className="text-[10px] text-[#7BA3CC] hover:text-white transition-colors mb-2 block truncate"
          title="All reviews"
        >
          {iconOnly ? '←' : '← All reviews'}
        </button>
        {!iconOnly && (
          <>
            <p className="text-sm font-bold text-[#C8A951] leading-none mb-1 tracking-wide truncate">
              ScholarFlow
            </p>
            {!compact && (
              <p className="text-xs text-white/80 font-medium truncate leading-snug">{projectName}</p>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto overflow-x-hidden">
        {/* Overview link */}
        <NavLink
          to={`/projects/${projectId}/home`}
          title="Overview"
          className={({ isActive }) =>
            `flex items-center py-1.5 rounded-lg text-sm transition-all duration-150 ${
              iconOnly ? 'justify-center px-1' : 'gap-2 px-2'
            } ${
              isActive
                ? 'bg-[#003580] text-white font-medium'
                : 'text-[#7BA3CC] hover:text-white hover:bg-[#003070]'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span style={isActive ? { color: '#C8A951' } : {}}>
                <HomeIcon />
              </span>
              {!iconOnly && <span className="truncate">Overview</span>}
              {isActive && !compact && <span className="ml-auto w-1 h-1 rounded-full bg-[#C8A951] shrink-0" />}
            </>
          )}
        </NavLink>
        <div className="border-t border-[#003580] mx-1" />
        {NAV.map(section => (
          <div key={section.label}>
            {!compact && (
              <p
                className="text-[9px] font-bold tracking-widest uppercase px-2 mb-1 truncate"
                style={{ color: section.color }}
              >
                {section.label}
              </p>
            )}
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={`/projects/${projectId}/${link.to}`}
                title={link.text}
                className={({ isActive }) =>
                  `flex items-center py-1.5 rounded-lg text-sm transition-all duration-150 ${
                    iconOnly ? 'justify-center px-1' : 'gap-2 px-2'
                  } ${
                    isActive
                      ? 'bg-[#003580] text-white font-medium'
                      : 'text-[#7BA3CC] hover:text-white hover:bg-[#003070]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className="transition-colors shrink-0"
                      style={isActive ? { color: '#C8A951' } : {}}
                    >
                      <link.Icon />
                    </span>
                    {!iconOnly && <span className="truncate">{link.text}</span>}
                    {isActive && !compact && (
                      <span className="ml-auto w-1 h-1 rounded-full bg-[#C8A951] shrink-0" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={`border-t border-[#003580] overflow-hidden ${iconOnly ? 'py-3 flex justify-center' : 'px-4 py-3'}`}>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          title="Sign out"
          className="text-xs text-[#7BA3CC] hover:text-red-400 transition-colors truncate"
        >
          {iconOnly ? '⏻' : compact ? '←' : 'Sign out'}
        </button>
      </div>

      {/* Drag handle — sits on the right edge */}
      <div
        onMouseDown={handleDragStart}
        className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize group z-10"
      >
        <div className="absolute right-0 top-0 w-[2px] h-full bg-transparent group-hover:bg-[#C8A951]/50 transition-colors duration-150" />
      </div>
    </aside>
  );
}
