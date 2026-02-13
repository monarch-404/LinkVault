import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    api.getHistory()
      .then(res => setHistory(res.data))
      .catch(() => navigate('/login')); // Redirect if not logged in
  }, [navigate]);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
        <div className="flex gap-4 items-center">
          <span className="text-gray-600">{userEmail}</span>
          <button 
            onClick={() => api.logout()} 
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name/Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    item.type === 'file' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.original_name || 'Secret Text'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.view_count} {item.max_views ? `/ ${item.max_views}` : ''}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(parseInt(item.created_at)).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href={`/v/${item.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">View</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && (
          <p className="p-6 text-center text-gray-500">No uploads yet.</p>
        )}
      </div>
    </div>
  );
}