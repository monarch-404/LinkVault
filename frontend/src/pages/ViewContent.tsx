import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function ViewContent() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [fileData, setFileData] = useState<{ url: string; name: string } | null>(null);
  const [password, setPassword] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const fetchContent = async (pwd?: string) => {
    if (!id) return;
    setError('');
    pwd ? setUnlocking(true) : setLoading(true);

    try {
      if (pwd) await sleep(600); 
      const res = await api.getContent(id, pwd);
      setIsLocked(false);
      setError('');

      if (res.headers['content-type']?.includes('application/json')) {
        setData(JSON.parse(await res.data.text()));
      } else {
        const url = window.URL.createObjectURL(res.data);
        let fileName = 'secure_file_download';
        const match = res.headers['content-disposition']?.match(/filename="?([^"]+)"?/);
        if (match && match.length >= 2) fileName = match[1];
        setFileData({ url, name: fileName });
      }
    } catch (err: any) {
      let errorMsg = 'Link expired or invalid';
      if (err.response?.status === 403 || err.response?.status === 401) { setIsLocked(true); }
      setError(errorMsg);
    } finally {
      setLoading(false); setUnlocking(false);
    }
  };

  useEffect(() => { fetchContent(); }, [id]);

  if (loading) return <div className="text-center mt-32 text-[#4f46e5] font-bold animate-pulse">Decrypting secure link...</div>;

  if (isLocked) {
    return (
      <div className="max-w-md mx-auto mt-32 p-10 bg-[#25262b] shadow-2xl rounded-3xl border border-[#373a40] text-center">
        <div className="w-16 h-16 bg-[#1a1b1e] border border-[#373a40] rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">🔒</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Protected Content</h2>
        <p className="text-gray-400 mb-8 text-sm">Enter the password to decrypt this link.</p>
        {error && <p className="text-red-400 mb-4 text-sm font-medium">{error}</p>}
        <input type="password" placeholder="Enter Password..." value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-[#1a1b1e] border border-[#373a40] rounded-xl text-white focus:border-[#4f46e5] outline-none mb-4 text-center tracking-widest" />
        <button onClick={() => fetchContent(password)} disabled={unlocking} className={`w-full text-white px-4 py-4 rounded-xl font-bold transition-all shadow-lg ${unlocking ? 'bg-[#4f46e5]/50' : 'bg-[#4f46e5] hover:bg-[#4338ca] shadow-indigo-500/20'}`}>
          {unlocking ? 'Unlocking...' : 'Unlock Content'}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-32">
        <h1 className="text-4xl font-bold text-white mb-2">Not found</h1>
        <p className="text-gray-400 mb-8">The link you are looking for is missing or expired.</p>
        <Link to="/" className="px-6 py-2 bg-[#4f46e5] text-white rounded-full font-medium hover:bg-[#4338ca] transition-colors">Main page</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-20 p-8 flex flex-col items-center">
       <h1 className="text-4xl font-bold mb-12 text-white">Share files effortlessly</h1>

       {fileData ? (
         <div className="flex flex-col items-center">
            {/* The Custom CSS Folder Graphic from Screenshot 2 */}
            <div className="relative w-48 h-36 bg-[#4f46e5] rounded-xl rounded-tl-none shadow-2xl flex flex-col justify-end p-4 group">
              <div className="absolute -top-4 left-0 w-16 h-4 bg-[#4f46e5] rounded-t-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-[#4f46e5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
              </div>
              <p className="text-white text-xs font-medium truncate mt-auto relative z-10 text-center">{fileData.name}</p>
            </div>

            <div className="flex items-center gap-4 mt-12">
              <Link to="/" className="px-6 py-2 border border-[#373a40] text-white rounded-full hover:bg-[#25262b] transition-colors font-medium">Back</Link>
              <a href={fileData.url} download={fileData.name} className="px-6 py-2 bg-[#4f46e5] text-white rounded-full font-medium hover:bg-[#4338ca] shadow-lg shadow-indigo-500/20 transition-all">Download all</a>
            </div>
         </div>
       ) : data ? (
         <div className="bg-[#25262b] p-8 rounded-2xl border border-[#373a40] font-mono whitespace-pre-wrap text-left text-gray-300 w-full max-w-2xl shadow-2xl">
           {data.content}
         </div>
       ) : null}
    </div>
  );
}