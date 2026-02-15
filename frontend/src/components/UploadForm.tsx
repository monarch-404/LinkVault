import { useState, useEffect } from 'react';
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

// --- Helper to format seconds into a clean countdown string ---
const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return "Expired";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

export default function UploadForm() {
  // --- State Management ---
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [maxViews, setMaxViews] = useState('');

  // Expiry States 
  const [expiryPreset, setExpiryPreset] = useState<number | 'custom'>(600);
  const [customDate, setCustomDate] = useState<string>(''); // For YYYY-MM-DD
  const [customTime, setCustomTime] = useState<string>(''); // For HH:MM

  // Results & UI States
  const [generatedLink, setGeneratedLink] = useState('');
  const [deleteToken, setDeleteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // --- THE FIX: Safely inside the component! ---
  const [confirmDelete, setConfirmDelete] = useState(false); 

  // Live Tracking States
  const [liveViews, setLiveViews] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [expiresAtTimestamp, setExpiresAtTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // --- Live Polling Effect (Views) ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (generatedLink && deleteToken && !isDead) {
      const linkId = generatedLink.split('/v/')[1];
      const checkStatus = async () => {
        try {
          const res = await api.getStatus(linkId, deleteToken);
          setLiveViews(res.data.view_count);
          if (res.data.is_dead) {
            setIsDead(true);
            clearInterval(interval);
          }
        } catch (err) {
          setIsDead(true);
          clearInterval(interval);
        }
      };
      checkStatus();
      interval = setInterval(checkStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [generatedLink, deleteToken, isDead]);

  // --- Live Countdown Timer Effect ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (expiresAtTimestamp && !isDead) {
      interval = setInterval(() => {
        const remaining = Math.floor((expiresAtTimestamp - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          setIsDead(true); // Automatically kill the UI when timer hits 0
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [expiresAtTimestamp, isDead]);

  // --- Check if user is logged in ---
  const isLoggedIn = !!localStorage.getItem('token');

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
    setLiveViews(0);
    setIsDead(false);
    setExpiresAtTimestamp(null);
    setLoading(true);

    try {
      // 1. Calculate Exact Expiry Seconds
      let calculatedExpirySeconds = 600;

      if (expiryPreset === 'custom') {
        if (!customDate || !customTime) {
          throw new Error("Please select both a date and a time.");
        }
        
        const selectedMs = new Date(`${customDate}T${customTime}`).getTime();
        const diffMs = selectedMs - Date.now();
        
        if (diffMs <= 0) {
          throw new Error("Custom expiry time must be in the future.");
        }
        calculatedExpirySeconds = Math.floor(diffMs / 1000);
      } else {
        calculatedExpirySeconds = Number(expiryPreset);
      }

      // 2. API Call
      let res;
      const views = maxViews ? parseInt(maxViews) : undefined;

      if (mode === 'text') {
        if (!text.trim()) throw new Error("Please enter some text.");
        res = await api.uploadText(text, calculatedExpirySeconds, password, views);
      } else {
        if (!file) throw new Error("Please select a file.");
        res = await api.uploadFile(file, calculatedExpirySeconds, password, views);
      }

      // 3. Set Success States & Start Timer
      const fullLink = `${window.location.origin}/v/${res.data.id}`;
      setGeneratedLink(fullLink);
      setDeleteToken(res.data.delete_token);
      
      setExpiresAtTimestamp(Date.now() + (calculatedExpirySeconds * 1000));
      setTimeLeft(calculatedExpirySeconds);

    } catch (err: any) {
      console.error("Upload failed", err);
      const msg = err.response?.data?.error || err.message || "Upload failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // --- Anonymous Emergency Delete Handler ---
  const handleEmergencyDelete = async () => {
    try {
      const linkId = generatedLink.split('/v/')[1];
      await api.deleteContent(linkId, deleteToken);
      setIsDead(true);
      setTimeLeft(0);
      setConfirmDelete(false); // Reset the button state
    } catch (err) {
      alert("Failed to delete the link. It may have already expired.");
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
          type="button"
          onClick={() => handleModeSwitch('text')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
            mode === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
          }`}
        >
          Text
        </button>
        <button
          type="button"
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
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
            <input
              type="file"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              onChange={(e) => {
                const selectedFile = e.target.files ? e.target.files[0] : null;
                
                // --- 30MB Frontend Gatekeeper ---
                if (selectedFile && selectedFile.size > 30 * 1024 * 1024) {
                  setError("File is too large! Please select a file under 30MB.");
                  setFile(null);
                  e.target.value = ''; // Reset the input box
                } else {
                  setFile(selectedFile);
                  setError(''); // Clear any previous errors
                }
              }}
            />
            <p className="text-xs text-gray-400 mt-3 font-medium">
              Maximum file size: <span className="text-gray-600 font-bold">30MB</span>
            </p>
          </div>
        )}
      </div>

      {/* 3. Pro Features */}
      <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="(Optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Views</label>
          <input
            type="number"
            className="w-full border border-gray-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. 1"
            value={maxViews}
            onChange={(e) => setMaxViews(e.target.value)}
          />
        </div>
      </div>

      {/* 4. Advanced Timer Selection */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
          Self-Destruct Timer
        </label>
        <select
          value={expiryPreset}
          onChange={(e) => setExpiryPreset(e.target.value === 'custom' ? 'custom' : Number(e.target.value))}
          className="w-full border border-gray-300 p-2 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
        >
          <option value={10}>⚡ 10 Seconds</option>
          <option value={60}>⏱️ 1 Minute</option>
          <option value={300}>⏱️ 5 Minutes</option>
          <option value={600}>⏱️ 10 Minutes</option>
          <option value={1800}>⏱️ 30 Minutes</option>
          <option value={3600}>⏳ 1 Hour</option>
          
          {/* --- PREMIUM FEATURES: Only show these if logged in! --- */}
          {isLoggedIn && (
            <>
              <option value={86400}>📅 1 Day</option>
              <option value="custom">⚙️ Custom Date & Time...</option>
            </>
          )}
        </select>

        {/* Custom Date & Time Picker */}
        {expiryPreset === 'custom' && isLoggedIn && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1">
            <div className="flex gap-2">
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]} 
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-[3] border border-blue-300 p-2 rounded-md bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none text-blue-800 font-medium"
              />
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="flex-[2] border border-blue-300 p-2 rounded-md bg-blue-50 focus:ring-2 focus:ring-blue-500 outline-none text-blue-800 font-medium"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 pl-1">
              Select the exact date and time this link should self-destruct.
            </p>
          </div>
        )}
        
        {/* Upsell message for anonymous users */}
        {!isLoggedIn && (
           <p className="text-[10px] text-blue-500 mt-1 pl-1 font-medium">
             Log in to unlock 24-hour links and custom self-destruct timers!
           </p>
        )}
      </div>

      {/* 5. Submit Button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={loading}
        className={`w-full py-3 rounded-lg text-white font-bold text-lg shadow-md transition-all flex justify-center items-center ${
          loading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
        }`}
      >
        {loading ? 'Generating Link...' : 'Create Secure Link'}
      </button>

      {/* 6. Error Feedback */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center font-medium">
          {error}
        </div>
      )}

      {/* 7. Success Result & Live Dashboard */}
      {generatedLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-in fade-in duration-300">
          
          <div className="flex flex-col gap-2 mb-3 border-b border-green-200 pb-3">
             <div className="flex justify-between items-center">
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

             {!isDead && (
               <div className="flex justify-between items-center bg-white p-2 rounded border border-orange-200 shadow-sm">
                 <span className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   Self-Destruct in:
                 </span>
                 <span className="text-sm font-mono font-bold text-orange-600">
                   {formatCountdown(timeLeft)}
                 </span>
               </div>
             )}
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded border border-green-300 shadow-sm mb-3">
            <input
              readOnly
              value={generatedLink}
              className={`flex-1 text-sm outline-none bg-transparent truncate font-mono ${
                isDead ? 'text-gray-400 line-through' : 'text-gray-600'
              }`}
            />
            <CopyButton text={generatedLink} label="Copy Link" />
          </div>

          {/* --- Anonymous Users: Double-Tap Destroy Button --- */}
          {deleteToken && !isLoggedIn && !isDead && (
            <div className="pt-3 border-t border-green-200 mt-3">
               <button
                 onClick={() => {
                   if (confirmDelete) {
                     handleEmergencyDelete();
                   } else {
                     setConfirmDelete(true);
                     // Reset back to normal after 3 seconds if they don't click again
                     setTimeout(() => setConfirmDelete(false), 3000);
                   }
                 }}
                 className={`w-full py-2 font-bold rounded-lg text-sm transition-all flex items-center justify-center gap-2 ${
                   confirmDelete 
                     ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
                     : 'bg-red-100 text-red-700 hover:bg-red-200'
                 }`}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                 {confirmDelete ? 'Click again to permanently destroy!' : 'Destroy Link Now'}
               </button>
               <p className="text-center text-[10px] text-gray-500 mt-1">
                 Leave this page, and the link will self-destruct when the timer runs out.
               </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}