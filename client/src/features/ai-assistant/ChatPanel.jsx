import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sendMessage, getChatHistory } from '../../services/ai.service';

function MessageBubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] text-white font-bold mr-2 mt-0.5 shrink-0 shadow-sm">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
            : 'bg-white text-gray-700 border border-[#E4E7EF] rounded-tl-sm shadow-sm'
        }`}
      >
        {content}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const { id: projectId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [loading, setLoading]   = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatHistory(projectId).then(setMessages).finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setMessages(prev => [...prev, { role: 'user', content: text, id: Date.now() }]);
    try {
      const { message } = await sendMessage(projectId, text);
      setMessages(prev => [...prev, { role: 'assistant', content: message, id: Date.now() + 1 }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        id: Date.now() + 1,
      }]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="flex flex-col h-full bg-[#F0F2F8]">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-[#E4E7EF]">
        <h1 className="text-sm font-bold text-gray-800">AI Assistant</h1>
        <p className="text-xs text-gray-400 mt-0.5">Ask questions about your literature corpus</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <p className="text-xs text-gray-400">Loading history…</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl shadow-md">
              🔬
            </div>
            <div>
              <p className="text-sm font-bold text-gray-700">Ask about your papers</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                Summarise themes, compare methods, or ask anything about papers in this project.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              {[
                'Summarize the main themes across included papers',
                'What methodologies are most common?',
                'Which papers focus on machine learning?',
              ].map(hint => (
                <button
                  key={hint}
                  onClick={() => setInput(hint)}
                  className="text-xs text-indigo-600 hover:text-indigo-500 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 transition-colors text-left shadow-sm"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => <MessageBubble key={m.id ?? i} role={m.role} content={m.content} />)}
            {sending && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] text-white font-bold mr-2 mt-0.5 shrink-0">
                  AI
                </div>
                <div className="bg-white border border-[#E4E7EF] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
                  <span className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-[#E4E7EF]">
        <div className="flex gap-2 items-end">
          <textarea
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your papers… (Enter to send)"
            className="flex-1 bg-[#F8FAFC] border border-[#E4E7EF] focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none transition-all"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors shrink-0 shadow-sm"
          >
            Send
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">Shift+Enter for new line</p>
      </div>
    </div>
  );
}
