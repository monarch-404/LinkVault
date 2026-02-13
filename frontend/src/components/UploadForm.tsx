import { useState } from 'react';
import { api } from '../services/api'; // <--- FIXED IMPORT

export default function UploadForm() {
  // --- State Management ---
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Expiry
  const [expirySeconds, setExpirySeconds] = useState<number>(600); 
  
  // NEW: Pro Features State
  const [password, setPassword] = useState('');
  const [maxViews, setMaxViews] = useState('');
  
  // Results
  const [generatedLink, setGeneratedLink] = useState('');
  const [deleteToken, setDeleteToken] = useState(''); // NEW: For manual delete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);

    try {
      let res;
      const views = maxViews ? parseInt(maxViews) : undefined;
      
      // 1. Validate & Call API using the 'api' object
      if (mode === 'text') {
        if (!text.trim()) throw new Error("Please enter some text.");
        // FIXED: Calling api.uploadText
        res = await api.uploadText(text, expirySeconds, password, views);
      } else {
        if (!file) throw new Error("Please select a file.");
        // FIXED: Calling api.uploadFile
        res = await api.uploadFile(file, expirySeconds, password, views);
      }

      // 2. Handle Success
      setGeneratedLink(res.data.link);
      setDeleteToken(res.data.deleteToken); // Capture the delete token
      
    } catch (err: any) {
      console.error("Upload failed", err);
      const msg = err.response?.data?.error || err.message || "Upload failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
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

      {/* 5. Submit Button */}
      <button 
        onClick={handleUpload}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Processing...' : 'Create Secure Link'}
      </button>

      {/* 6. Error Feedback */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      {/* 7. Success Result */}
      {generatedLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 mb-2 font-bold text-center">
            🎉 Link Ready!
          </p>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-300 shadow-sm mb-3">
            <input 
              readOnly 
              value={generatedLink} 
              className="flex-1 text-sm text-gray-600 outline-none bg-transparent truncate"
            />
            <button 
              onClick={() => copyToClipboard(generatedLink)}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold rounded"
            >
              Copy
            </button>
          </div>

          {/* Manual Delete Token Display */}
          {deleteToken && (
            <div className="pt-3 border-t border-green-200">
               <p className="text-xs text-red-600 font-bold uppercase mb-1">
                 ⚠️ Owner Key (Save this!)
               </p>
               <div className="flex gap-2 bg-red-50 p-2 rounded border border-red-100">
                 <code className="text-xs text-red-800 flex-1 break-all font-mono">{deleteToken}</code>
                 <button 
                    onClick={() => copyToClipboard(deleteToken)}
                    className="text-xs bg-white border px-2 rounded hover:bg-gray-50"
                 >
                   Copy
                 </button>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}