import { useState, useEffect } from 'react'; // Make sure useEffect is imported
import { api } from '../services/api';

// --- Sub-component for Inline Copy Feedback ---
const CopyButton = ({ text, label = "Copy" }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1 text-xs font-bold rounded transition-all duration-300 min-w-[70px] ${
        copied
          ? 'bg-green-600 text-white scale-105'
          : 'bg-green-100 hover:bg-green-200 text-green-700'
      }`}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  );
};

export default function UploadForm() {
  // --- State Management ---
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [expirySeconds, setExpirySeconds] = useState<number>(600);
  const [password, setPassword] = useState('');
  const [maxViews, setMaxViews] = useState('');

  // Results
  const [generatedLink, setGeneratedLink] = useState('');
  const [deleteToken, setDeleteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- NEW: Live Tracking States ---
  const [liveViews, setLiveViews] = useState(0);
  const [isDead, setIsDead] = useState(false);


  // --- Live Polling Effect ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (generatedLink && deleteToken && !isDead) {
      const linkId = generatedLink.split('/v/')[1]; // Extract ID from the URL
      
      const checkStatus = async () => {
        try {
          const res = await api.getStatus(linkId, deleteToken);
          setLiveViews(res.data.view_count);
          
          if (res.data.is_dead) {
            setIsDead(true);
            clearInterval(interval); // Stop asking once it's dead
          }
        } catch (err) {
          setIsDead(true); // If it returns 404, it was deleted
          clearInterval(interval);
        }
      };

      // Check immediately, then every 3 seconds
      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }

    return () => clearInterval(interval); // Cleanup timer if component closes
  }, [generatedLink, deleteToken, isDead]);

  // --- Handlers ---
  const handleModeSwitch = (newMode: 'text' | 'file') => {
    setMode(newMode);
    setGeneratedLink('');
    setDeleteToken('');
    setError('');
  };

  const handleUpload = async () => {
    setError('');
    setGeneratedLink('');
    setDeleteToken('');
    setLiveViews(0);   // <-- Reset views
    setIsDead(false);  // <-- Reset status
    setLoading(true);

    try {
      let res;
      const views = maxViews ? parseInt(maxViews) : undefined;

      if (mode === 'text') {
        if (!text.trim()) throw new Error("Please enter some text.");
        res = await api.uploadText(text, expirySeconds, password, views);
      } else {
        if (!file) throw new Error("Please select a file.");
        res = await api.uploadFile(file, expirySeconds, password, views);
      }

      setGeneratedLink(res.data.link);
      setDeleteToken(res.data.deleteToken);
    } catch (err: any) {
      console.error("Upload failed", err);
      const msg = err.response?.data?.error || err.message || "Upload failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        LinkVault Pro
      </h2>

      {/* 1. Mode Toggle */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => handleModeSwitch('text')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
            mode === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
          }`}
        >
          Text
        </button>
        <button
          onClick={() => handleModeSwitch('file')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
            mode === 'file' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
          }`}
        >
          File
        </button>
      </div>

      {/* 2. Main Input Area */}
      <div className="mb-4">
        {mode === 'text' ? (
          <textarea
            className="w-full border border-gray-300 p-3 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            placeholder="Paste your secret text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50">
            <input
              type="file"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
          </div>
        )}
      </div>

      {/* 3. Pro Features (Password & Limits) */}
      <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded text-sm"
            placeholder="(Optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Views</label>
          <input
            type="number"
            className="w-full border p-2 rounded text-sm"
            placeholder="e.g. 1"
            value={maxViews}
            onChange={(e) => setMaxViews(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Timer Selection */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Expires After
        </label>
        <select
          value={expirySeconds}
          onChange={(e) => setExpirySeconds(Number(e.target.value))}
          className="w-full border border-gray-300 p-2 rounded-md bg-white"
        >
          <option value={10}>⚡ 10 Seconds</option>
          <option value={600}>10 Minutes</option>
          <option value={3600}>1 Hour</option>
          <option value={86400}>24 Hours</option>
        </select>
      </div>

      {/* 5. Submit Button with Inline Loading UI */}
      <button
        onClick={handleUpload}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all flex justify-center items-center ${
          loading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Link...
          </span>
        ) : (
          'Create Secure Link'
        )}
      </button>

      {/* 6. Error Feedback */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      {/* 7. Success Result */}
      {generatedLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
          
          {/* --- Live Tracker Badge --- */}
          <div className="flex justify-between items-center mb-3 border-b border-green-200 pb-2">
             <p className="text-sm text-green-800 font-bold">🎉 Link Ready!</p>
             <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
               isDead ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
             }`}>
               {!isDead && (
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
               )}
               {isDead ? 'Link Destroyed' : `Live Views: ${liveViews} ${maxViews ? `/ ${maxViews}` : ''}`}
             </div>
          </div>

          {/* --- The Secure Link (Restored!) --- */}
          <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-300 shadow-sm mb-3 transition-all duration-300">
            <input
              readOnly
              value={generatedLink}
              className={`flex-1 text-sm outline-none bg-transparent truncate font-mono ${
                isDead ? 'text-gray-400 line-through' : 'text-gray-600'
              }`}
            />
            <CopyButton text={generatedLink} label="Copy Link" />
          </div>

          {/* --- Manual Delete Token --- */}
          {deleteToken && (
            <div className="pt-3 border-t border-green-200">
               <p className="text-xs text-red-600 font-bold uppercase mb-1">
                 ⚠️ Owner Key (Save this!)
               </p>
               <div className="flex items-center gap-2 bg-red-50 p-2 rounded border border-red-100">
                 <code className="text-[10px] text-red-800 flex-1 break-all font-mono">{deleteToken}</code>
                 <CopyButton text={deleteToken} label="Copy Key" />
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}