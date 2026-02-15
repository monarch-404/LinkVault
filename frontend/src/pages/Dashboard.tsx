import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';


// --- Sub-component for Inline Copy Feedback ---
// --- Sub-component for Inline Copy Feedback ---
const CopyButton = ({ text, disabled }: { text: string; disabled?: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (disabled) return; // Prevent copying if dead
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      disabled={disabled}
      className={`px-3 py-1 text-xs font-bold rounded transition-all duration-300 w-24 ${
        disabled 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' // Grayed out if dead
          : copied
            ? 'bg-green-600 text-white scale-105'
            : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
      }`}
    >
      {copied ? '✓ Copied!' : 'Copy Link'}
    </button>
  );
};

// --- Sub-component for Hold-to-Delete ---
const DeleteButton = ({ onDelete, disabled }: { onDelete: () => void, disabled: boolean }) => {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>; // <-- The perfect cross-platform TS fix
    if (holding) {
      // Fill up to 100% over 1.5 seconds (15 steps of 100ms)
      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(timer);
            setHolding(false);
            onDelete();
            return 100;
          }
          return p + (100 / 15);
        });
      }, 100);
    } else {
      setProgress(0); // Instantly reset if they let go early
    }
    return () => clearInterval(timer);
  }, [holding, onDelete]);

  return (
    <button
      onMouseDown={() => !disabled && setHolding(true)}
      onMouseUp={() => setHolding(false)}
      onMouseLeave={() => setHolding(false)}
      onTouchStart={() => !disabled && setHolding(true)} // For Mobile
      onTouchEnd={() => setHolding(false)}
      disabled={disabled}
      className={`relative overflow-hidden px-3 py-1 text-sm font-medium rounded transition-colors ${
        disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'
      }`}
    >
      <span className="relative z-10 select-none">
        {progress > 0 && progress < 100 ? 'Hold...' : 'Delete'}
      </span>
      {/* The Red Fill Animation */}
      <div 
        className="absolute top-0 left-0 h-full bg-red-600 opacity-20 transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </button>
  );
};

interface HistoryItem {
  id: string;
  type: string;
  original_name?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  max_views: number | null;
  delete_token: string;
}

export default function Dashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const res = await api.getHistory();
      setHistory(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/login'); // Kick to login if token expired
      } else {
        setError('Failed to load history');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, token: string) => {
    // if (!window.confirm("Are you sure you want to delete this link?")) return;
    
    try {
      await api.deleteContent(id, token);
      // Remove item from UI instantly without refreshing
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Failed to delete content");
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/v/${id}`;
    navigator.clipboard.writeText(link);
    // Note: You could use your new CopyButton component here too!
  };

  if (loading) return <div className="text-center mt-20 font-bold text-gray-500">Loading Dashboard...</div>;
  if (error) return <div className="text-center mt-20 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Your Active Links</h2>
      
      {history.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow text-center text-gray-500">
          You don't have any active links.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                <th className="p-4 border-b">Type / Name</th>
                <th className="p-4 border-b text-center">Views</th>
                <th className="p-4 border-b text-center">Expires In</th>
                <th className="p-4 border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const isExpired = Date.now() > Number(item.expires_at);
                const isLimitReached = item.max_views !== null && item.view_count >= item.max_views;
                const isDead = isExpired || isLimitReached;

                return (
                  <tr key={item.id} className={`border-b hover:bg-gray-50 transition ${isDead ? 'opacity-50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.type === 'file' ? '📄' : '📝'}</span>
                        <div>
                          <p className="font-bold text-gray-800 truncate max-w-[200px]">
                            {item.type === 'file' ? item.original_name : 'Secret Text'}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">{item.id}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* View Count Display */}
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isLimitReached ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.view_count} / {item.max_views || '∞'}
                      </span>
                    </td>

                    <td className="p-4 text-center text-sm text-gray-600">
                      {isDead ? 'Expired' : `${Math.round((Number(item.expires_at) - Date.now()) / 60000)} mins`}
                    </td>

                    <td className="p-4 text-right flex justify-end gap-2">
                        <CopyButton text={`${window.location.origin}/v/${item.id}`} disabled={isDead} />
                        
                        {/* The Magic Hold-to-Delete Button */}
                        <DeleteButton 
                          onDelete={() => handleDelete(item.id, item.delete_token)} 
                          disabled={isDead} 
                        />
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