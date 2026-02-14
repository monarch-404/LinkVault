import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

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
    if (!window.confirm("Are you sure you want to delete this link?")) return;
    
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

                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => copyLink(item.id)}
                        disabled={isDead}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium disabled:opacity-50"
                      >
                        Copy
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.delete_token)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm font-medium"
                      >
                        Delete
                      </button>
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