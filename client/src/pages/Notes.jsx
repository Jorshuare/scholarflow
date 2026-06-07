import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { updateProject } from '../services/projects.service';

export default function Notes() {
  const { id: projectId }  = useParams();
  const { project }        = useOutletContext();

  const [text, setText]    = useState(project?.notes ?? '');
  const [status, setStatus] = useState('idle'); // idle | saving | saved
  const timerRef           = useRef(null);

  useEffect(() => {
    setText(project?.notes ?? '');
  }, [project?.id]);

  function handleChange(e) {
    setText(e.target.value);
    setStatus('idle');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(e.target.value), 1500);
  }

  async function save(value) {
    setStatus('saving');
    try {
      await updateProject(projectId, { notes: value });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('idle');
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">

      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-gray-800">Project Notes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Write anything — ideas, decisions, observations</p>
        </div>
        <span className={`text-xs font-medium transition-opacity duration-300 ${
          status === 'saving' ? 'text-amber-500 opacity-100' :
          status === 'saved'  ? 'text-emerald-500 opacity-100' :
          'opacity-0'
        }`}>
          {status === 'saving' ? 'Saving…' : 'Saved'}
        </span>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6">
        <textarea
          value={text}
          onChange={handleChange}
          placeholder="Start writing your notes here…&#10;&#10;Ideas, decisions, observations, anything relevant to this project."
          className="w-full h-full min-h-[400px] bg-white border border-[#E4E7EF] rounded-2xl shadow-sm px-6 py-5 text-sm text-gray-800 leading-relaxed placeholder-gray-300 resize-none focus:outline-none focus:border-[#C8A951] focus:ring-2 focus:ring-[#C8A951]/20 transition-all"
        />
      </div>
    </div>
  );
}
