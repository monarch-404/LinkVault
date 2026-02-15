import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CopyButton = ({ text, disabled }: { text: string; disabled?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (disabled) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} disabled={disabled} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 min-w-[80px] ${
        disabled ? 'bg-[#1a1b1e] text-gray-600 cursor-not-allowed border border-[#373a40]' : copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20 border border-[#4f46e5]/20'
      }`}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const DeleteButton = ({ onDelete, disabled }: { onDelete: () => void, disabled: boolean }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (holding) {
      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(timer); setHolding(false); onDelete(); return 100; }
          return p + (100 / 15);
        });
      }, 100);
    } else { setProgress(0); }
    return () => clearInterval(timer);
  }, [holding, onDelete]);

  return (
    <button onMouseDown={() => !disabled && setHolding(true)} onMouseUp={() => setHolding(false)} onMouseLeave={() => setHolding(false)} disabled={disabled} className={`relative overflow-hidden px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
        disabled ? 'bg-[#1a1b1e] text-gray-600 border-[#373a40] cursor-not-allowed' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20'
      }`}>
      <span className="relative z-10">{progress > 0 && progress < 100 ? 'Hold...' : 'Delete'}</span>
      <div className="absolute top-0 left-0 h-full bg-red-500 opacity-30 transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
    </button>
  );
};

interface HistoryItem { id: string; type: string; original_name?: string; created_at: string; expires_at: string; view_count: number; max_views: number | null; delete_token: string; }

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.getHistory().then(res => setHistory(res.data)).catch(err => {
      if (err.response?.status === 401) navigate('/login'); else setError('Failed to load history');
    }).finally(() => setLoading(false));
  }, [navigate]);

  const handleDelete = async (id: string, token: string) => {
    try { await api.deleteContent(id, token); setHistory(prev => prev.filter(item => item.id !== id)); } catch (err) { alert("Failed to delete content"); }
  };

  if (loading) return <div className="text-center mt-32 text-gray-500 font-medium animate-pulse">Loading secure vault...</div>;
  if (error) return <div className="text-center mt-32 text-red-400">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto mt-12 p-6">
      <h2 className="text-3xl font-bold mb-8 text-white">Your Active Links</h2>
      {history.length === 0 ? (
        <div className="bg-[#25262b] border border-[#373a40] p-16 rounded-3xl text-center text-gray-500 flex flex-col items-center">
          <div className="text-6xl mb-4 opacity-50">📭</div>
          <p>Your vault is currently empty.</p>
        </div>
      ) : (
        <div className="bg-[#25262b] border border-[#373a40] rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a1b1e] text-gray-400 uppercase text-xs tracking-wider border-b border-[#373a40]">
                <th className="p-5 font-bold">Type / Name</th>
                <th className="p-5 font-bold text-center">Views</th>
                <th className="p-5 font-bold text-center">Expires In</th>
                <th className="p-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const isDead = Date.now() > Number(item.expires_at) || (item.max_views !== null && item.view_count >= item.max_views);
                return (
                  <tr key={item.id} className={`border-b border-[#373a40] hover:bg-[#2c2d33] transition-colors ${isDead ? 'opacity-40' : ''}`}>
                    <td className="p-5 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#1a1b1e] border border-[#373a40] flex items-center justify-center text-xl">
                        {item.type === 'file' ? '📄' : '📝'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-200 truncate max-w-[200px]">{item.type === 'file' ? item.original_name : 'Secret Text'}</p>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{item.id}</p>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDead ? 'bg-gray-800 text-gray-500' : 'bg-[#4f46e5]/20 text-[#818cf8]'}`}>
                        {item.view_count} / {item.max_views || '∞'}
                      </span>
                    </td>
                    <td className="p-5 text-center text-sm text-gray-400">
                      {isDead ? 'Expired' : `${Math.round((Number(item.expires_at) - Date.now()) / 60000)} mins`}
                    </td>
                    <td className="p-5 flex justify-end gap-2">
                        <CopyButton text={`${window.location.origin}/v/${item.id}`} disabled={isDead} />
                        <DeleteButton onDelete={() => handleDelete(item.id, item.delete_token)} disabled={isDead} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}