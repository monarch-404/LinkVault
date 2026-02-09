import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getContent } from '../services/api';

export default function ViewContent() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getContent(id)
      .then(res => setData(res.data))
      .catch(() => setError('Link expired or invalid')); // [cite: 28, 33]
  }, [id]);

  if (error) return <div className="text-center text-red-500 mt-10 text-xl">{error}</div>;
  if (!data) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow mt-10 rounded">
      <h2 className="text-2xl font-bold mb-4">Shared Content</h2>
      
      {data.type === 'text' ? (
        <div className="bg-gray-50 p-4 rounded border relative">
           <pre className="whitespace-pre-wrap">{data.content}</pre> {/* [cite: 38] */}
           <button 
             onClick={() => navigator.clipboard.writeText(data.content)}
             className="absolute top-2 right-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded"
           >Copy</button> {/* [cite: 39] */}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="mb-4">This link contains a file.</p>
          <a 
            href={`http://localhost:5000/api/content/${id}`} // Direct download link
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Download File {/* [cite: 41] */}
          </a>
        </div>
      )}
    </div>
  );
}