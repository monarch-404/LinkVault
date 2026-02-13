import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api'; // <--- FIXED IMPORT

export default function ViewContent() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false); // Controls password UI
  const [error, setError] = useState('');

  const fetchContent = (pwd?: string) => {
    if (!id) return;
    
    // FIXED: Calling api.getContent instead of just getContent
    api.getContent(id, pwd)
      .then(res => {
        setIsLocked(false);
        // Handle file download vs text display
        if (res.headers['content-type']?.includes('application/json')) {
           setData(res.data);
        } else {
           // If it is a file download, the browser needs a nudge
           // Since we use POST for passwords, we handle the blob download manually
           const url = window.URL.createObjectURL(new Blob([res.data]));
           const link = document.createElement('a');
           link.href = url;
           // We try to get filename from headers, or default to 'download'
           const contentDisposition = res.headers['content-disposition'];
           let fileName = 'download';
           if (contentDisposition) {
             const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
             if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
           }
           link.setAttribute('download', fileName);
           document.body.appendChild(link);
           link.click();
           link.remove();
        }
      })
      .catch(err => {
        // If 403/401, it means Password Required/Incorrect
        if (err.response?.status === 403 || err.response?.status === 401) {
          setIsLocked(true);
          setError(err.response.data.error);
        } else {
          setError(err.response?.data?.error || 'Link expired or invalid');
        }
      });
  };

  useEffect(() => {
    fetchContent();
  }, [id]);

  if (isLocked) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white shadow-lg rounded-xl text-center">
        <h2 className="text-2xl font-bold mb-4">🔒 Protected Content</h2>
        <p className="text-red-500 mb-4 font-medium">{error}</p>
        <input 
          type="password" 
          placeholder="Enter Password..." 
          className="border border-gray-300 p-3 rounded-lg w-full mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button 
          onClick={() => fetchContent(password)} 
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
        >
          Unlock Content
        </button>
      </div>
    );
  }

  if (error) return <div className="text-center mt-20 text-red-500 text-xl font-bold">{error}</div>;
  if (!data) return <div className="text-center mt-20 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 bg-white shadow-lg rounded-xl">
       <h1 className="text-2xl font-bold mb-4 text-gray-800">Secret Message</h1>
       <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 font-mono whitespace-pre-wrap text-gray-700">
         {data.content}
       </div>
    </div>
  );
}