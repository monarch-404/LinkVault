import { useState } from 'react';
import { uploadText, uploadFile } from '../services/api';

export default function UploadForm() {
  // --- State Management ---
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Default to 600 seconds (10 mins)
  const [expirySeconds, setExpirySeconds] = useState<number>(600); 
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Handlers ---
  const handleModeSwitch = (newMode: 'text' | 'file') => {
    setMode(newMode);
    setGeneratedLink(''); // Clear previous results
    setError('');
  };

  const handleUpload = async () => {
    // Reset UI state
    setError('');
    setGeneratedLink('');
    setLoading(true);

    try {
      let res;
      
      // 1. Validate & Call API based on mode
      if (mode === 'text') {
        if (!text.trim()) throw new Error("Please enter some text.");
        res = await uploadText(text, expirySeconds);
      } else {
        if (!file) throw new Error("Please select a file.");
        res = await uploadFile(file, expirySeconds);
      }

      // 2. Handle Success
      // The backend returns { link: "...", expiresAt: ... }
      setGeneratedLink(res.data.link); 
      
    } catch (err: any) {
      console.error("Upload failed", err);
      // specific error message from backend or generic fallback
      const msg = err.response?.data?.error || err.message || "Upload failed. Check backend connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        LinkVault Upload
      </h2>
      
      {/* 1. Mode Toggle */}
      <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
        <button 
          onClick={() => handleModeSwitch('text')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
            mode === 'text' 
              ? 'bg-white shadow text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Text
        </button>
        <button 
          onClick={() => handleModeSwitch('file')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
            mode === 'file' 
              ? 'bg-white shadow text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          File
        </button>
      </div>

      {/* 2. Input Area */}
      <div className="mb-6">
        {mode === 'text' ? (
          <textarea 
            className="w-full border border-gray-300 p-3 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none transition-shadow"
            placeholder="Paste your secret text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
            <input 
              type="file" 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            />
            {file && <p className="mt-2 text-xs text-green-600 font-medium">Selected: {file.name}</p>}
          </div>
        )}
      </div>

      {/* 3. Timer Selection */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Expires After
        </label>
        <select 
          value={expirySeconds} 
          onChange={(e) => setExpirySeconds(Number(e.target.value))}
          className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
        >
          <option value={10}>⚡ 10 Seconds (Fast Test)</option>
          <option value={60}>1 Minute</option>
          <option value={300}>5 Minutes</option>
          <option value={600}>10 Minutes (Default)</option>
          <option value={3600}>1 Hour</option>
          <option value={86400}>24 Hours</option>
        </select>
      </div>

      {/* 4. Action Button */}
      <button 
        onClick={handleUpload}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all transform active:scale-95 ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed animate-pulse' 
            : 'bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
        }`}
      >
        {loading ? 'Generating Link...' : 'Create Secure Link'}
      </button>

      {/* 5. Feedback Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
          {error}
        </div>
      )}

      {/* 6. Success Display */}
      {generatedLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-sm text-green-800 mb-2 font-bold text-center">
            🎉 Link Generated Successfully!
          </p>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-300 shadow-sm">
            <input 
              readOnly 
              value={generatedLink} 
              className="flex-1 text-sm text-gray-600 font-mono outline-none bg-transparent truncate"
            />
            <button 
              onClick={copyToClipboard}
              className="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold rounded transition-colors"
            >
              Copy
            </button>
          </div>
          
          <p className="text-xs text-center text-gray-400 mt-2">
            This link will expire in {expirySeconds} seconds.
          </p>
        </div>
      )}
    </div>
  );
}