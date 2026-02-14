import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function ViewContent() {
  const { id } = useParams();
  
  // --- States ---
  const [data, setData] = useState<any>(null); // Holds Secret Text
  const [fileData, setFileData] = useState<{ url: string; name: string } | null>(null); // Holds File Info
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // For initial page load
  const [unlocking, setUnlocking] = useState(false); // NEW: For the button

  const fetchContent = async (pwd?: string) => {
    if (!id) return;
    
    setError('');

    if (pwd) {
      setUnlocking(true);
    } else {
      setLoading(true);
    }

    try {
      // --- THE UX FIX ---
      // Force the UI to wait 600ms so the user can actually see the "Unlocking..." state
      if (pwd) {
        await sleep(600); 
      }

      const res = await api.getContent(id, pwd);
      
      setIsLocked(false);
      setError('');

      const contentType = res.headers['content-type'];

      if (contentType && contentType.includes('application/json')) {
        const textResponse = await res.data.text(); 
        setData(JSON.parse(textResponse));
      } else {
        const url = window.URL.createObjectURL(res.data);
        let fileName = 'secure_file_download';
        const contentDisposition = res.headers['content-disposition'];
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match.length >= 2) fileName = match[1];
        }
        setFileData({ url, name: fileName });
      }
    } catch (err: any) {
      // ... keep your existing error logic ...
      let errorMsg = 'Link expired or invalid';
      let status = err.response?.status;

      if (err.response?.data instanceof Blob) {
        const errText = await err.response.data.text();
        try {
          const errJson = JSON.parse(errText);
          errorMsg = errJson.error || errorMsg;
        } catch (e) {}
      }

      if (status === 403 || status === 401) {
        setIsLocked(true);
        setError(errorMsg);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      setUnlocking(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [id]);

  // --- RENDERING ---

  if (loading) {
    return <div className="text-center mt-20 text-blue-500 font-bold animate-pulse">Decrypting secure link...</div>;
  }

  // 1. Password Screen
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
        disabled={unlocking} 
        className={`w-full text-white px-4 py-3 rounded-lg font-bold transition ${
          unlocking ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
        >
          {unlocking ? 'Unlocking...' : 'Unlock Content'}
        </button>
      </div>
    );
  }

  // 2. Error Screen
  if (error) {
    return <div className="text-center mt-20 text-red-500 text-xl font-bold">{error}</div>;
  }

  // 3. Success Screen (Text or File)
  return (
    <div className="max-w-2xl mx-auto mt-20 p-8 bg-white shadow-lg rounded-xl text-center">
       <h1 className="text-2xl font-bold mb-6 text-gray-800">
         {fileData ? 'Secure File Ready' : 'Secret Message'}
       </h1>

       {fileData ? (
         // UI for Files
         <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 flex flex-col items-center gap-4">
            <div className="text-5xl">📄</div>
            <p className="font-mono text-gray-700 font-bold text-lg">{fileData.name}</p>
            
            {/* The Download Button */}
            <a 
              href={fileData.url} 
              download={fileData.name}
              className="mt-4 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all shadow-md flex items-center gap-2 transform active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download File
            </a>
         </div>
       ) : data ? (
         // UI for Text
         <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 font-mono whitespace-pre-wrap text-left text-gray-700">
           {data.content}
         </div>
       ) : null}
    </div>
  );
}