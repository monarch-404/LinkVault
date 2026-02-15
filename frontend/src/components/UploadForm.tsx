import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CopyButton = ({ text, disabled }: { text: string; disabled?: boolean }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { 
    if (disabled) return;
    navigator.clipboard.writeText(text); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };
  return (
    <button 
      onClick={handleCopy} 
      disabled={disabled}
      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all min-w-[80px] ${
        disabled 
          ? 'bg-[#1a1b1e] text-gray-600 cursor-not-allowed border border-[#373a40]' 
          : copied 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-[#4f46e5]/10 hover:bg-[#4f46e5]/20 text-[#818cf8]'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
};

const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return "Expired";
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${m}m`;
  return `${m}m ${s}s`;
};

export default function UploadForm() {
  const navigate = useNavigate();
  // --- STATE ---
  const [mode, setMode] = useState<'text' | 'file'>('text'); 
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [expiryPreset, setExpiryPreset] = useState<number | 'custom'>(600);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [deleteToken, setDeleteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [liveViews, setLiveViews] = useState(0);
  const [isDead, setIsDead] = useState(false);
  const [expiresAtTimestamp, setExpiresAtTimestamp] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const [isDragging, setIsDragging] = useState(false);

  const isLoggedIn = !!localStorage.getItem('token');

  // --- EFFECTS ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (generatedLink && deleteToken && !isDead) {
      const linkId = generatedLink.split('/v/')[1];
      const checkStatus = async () => {
        try { const res = await api.getStatus(linkId, deleteToken); setLiveViews(res.data.view_count); if (res.data.is_dead) { setIsDead(true); clearInterval(interval); } } catch (err) { setIsDead(true); clearInterval(interval); }
      };
      checkStatus(); interval = setInterval(checkStatus, 3000);
    }
    return () => clearInterval(interval);
  }, [generatedLink, deleteToken, isDead]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (expiresAtTimestamp && !isDead) {
      interval = setInterval(() => {
        const remaining = Math.floor((expiresAtTimestamp - Date.now()) / 1000);
        if (remaining <= 0) { setTimeLeft(0); setIsDead(true); clearInterval(interval); } else setTimeLeft(remaining);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [expiresAtTimestamp, isDead]);

  // --- HANDLERS ---
  const handleUpload = async () => {
    setError(''); setGeneratedLink(''); setDeleteToken(''); setLiveViews(0); setIsDead(false); setExpiresAtTimestamp(null); setLoading(true);
    try {
      let calculatedExpirySeconds = 600;
      if (expiryPreset === 'custom') {
        if (!customDate || !customTime) throw new Error("Select both date and time.");
        const diffMs = new Date(`${customDate}T${customTime}`).getTime() - Date.now();
        if (diffMs <= 0) throw new Error("Time must be in the future.");
        calculatedExpirySeconds = Math.floor(diffMs / 1000);
      } else calculatedExpirySeconds = Number(expiryPreset);

      let res;
      const views = maxViews ? parseInt(maxViews) : undefined;
      if (mode === 'text') {
        if (!text.trim()) throw new Error("Enter some text.");
        res = await api.uploadText(text, calculatedExpirySeconds, password, views);
      } else {
        if (!file) throw new Error("Select a file.");
        res = await api.uploadFile(file, calculatedExpirySeconds, password, views);
      }
      
      setGeneratedLink(`${window.location.origin}/v/${res.data.id}`);
      setDeleteToken(res.data.delete_token);
      setExpiresAtTimestamp(Date.now() + (calculatedExpirySeconds * 1000));
      setTimeLeft(calculatedExpirySeconds);
    } catch (err: any) { setError(err.response?.data?.error || err.message || "Upload failed."); } finally { setLoading(false); }
  };

  const handleEmergencyDelete = async () => {
    try { await api.deleteContent(generatedLink.split('/v/')[1], deleteToken); setIsDead(true); setTimeLeft(0); setConfirmDelete(false); } catch (err) { alert("Failed to delete."); }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files ? e.dataTransfer.files[0] : null;
    if (droppedFile) {
      if (droppedFile.size > 30 * 1024 * 1024) { setError("File is too large! Please select a file under 30MB."); setFile(null); } else { setFile(droppedFile); setError(''); }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 mt-12 flex flex-col lg:flex-row items-center lg:items-start gap-16">
      
      {/* LEFT COLUMN: The Interactive Dropzone Graphic */}
      <div className="w-full lg:w-1/2 flex flex-col items-center">
        {/* Toggle Mode */}
        <div className="flex bg-[#25262b] p-1.5 rounded-xl w-64 mb-10 border border-[#373a40]">
          <button onClick={() => setMode('text')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'text' ? 'bg-[#4f46e5] text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-gray-400 hover:text-[#818cf8] hover:bg-[#4f46e5]/10'}`}>Text</button>
          <button onClick={() => setMode('file')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${mode === 'file' ? 'bg-[#4f46e5] text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-gray-400 hover:text-[#818cf8] hover:bg-[#4f46e5]/10'}`}>File</button>
        </div>

        {mode === 'file' ? (
          // Advanced Drag & Drop CSS Folder
          <div className="relative w-80 h-96 group" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <div className={`absolute inset-0 rounded-3xl rounded-tl-none transform transition-all duration-500 ease-out ${isDragging ? 'bg-[#818cf8]/80 translate-y-12 translate-x-12 scale-105' : 'bg-[#818cf8]/40 translate-y-8 translate-x-8 group-hover:translate-y-10 group-hover:translate-x-10'}`}></div>
            <div className={`absolute inset-0 rounded-3xl rounded-tl-none transform transition-all duration-500 ease-out ${isDragging ? 'bg-[#4f46e5]/90 translate-y-6 translate-x-6 scale-105' : 'bg-[#4f46e5]/60 translate-y-4 translate-x-4 group-hover:translate-y-5 group-hover:translate-x-5'}`}></div>
            
            {/* The Main Folder Card with light blue border default, rich blue hover */}
            <div className={`absolute inset-0 rounded-3xl rounded-tl-none flex flex-col items-center justify-center cursor-pointer transition-all duration-500 ease-out border-2 ${isDragging ? 'bg-[#111318] border-[#818cf8] shadow-[0_0_40px_rgba(129,140,248,0.4)] scale-105' : 'bg-[#0B0C10] border-[#a5b4fc]/50 group-hover:bg-[#111318] group-hover:border-[#818cf8]/80 group-hover:shadow-[0_0_30px_rgba(129,140,248,0.2)]'}`}>
              <div className={`absolute -top-6 left-0 w-32 h-6 rounded-t-xl border-t-2 border-l-2 border-r-2 transition-all duration-500 ${isDragging ? 'bg-[#111318] border-[#818cf8]' : 'bg-[#0B0C10] border-[#a5b4fc]/50 group-hover:bg-[#111318] group-hover:border-[#818cf8]/80'}`}></div>
              
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={(e) => {
                 const f = e.target.files ? e.target.files[0] : null;
                 if (f && f.size > 30 * 1024 * 1024) { setError("File over 30MB limit."); setFile(null); e.target.value = ''; } else { setFile(f); setError(''); }
              }} />
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 shadow-xl z-10 font-light transition-all duration-500 ${isDragging ? 'bg-gradient-to-r from-[#4f46e5] to-[#818cf8] text-white scale-110 shadow-indigo-500/50' : 'bg-white text-[#0B0C10] group-hover:bg-gradient-to-tr group-hover:from-[#4f46e5] group-hover:to-[#818cf8] group-hover:text-white group-hover:scale-110'}`}>+</div>
              <p className="text-white font-medium z-10 transition-colors">{isDragging ? 'Drop it here!' : (file ? file.name : "Choose or drag file")}</p>
              {!file && !isDragging && <p className="text-gray-500 text-xs mt-2 z-10 transition-opacity">Up to 30MB</p>}
            </div>
          </div>
        ) : (
          /* --- TEXT CARD --- */
          <div className="w-full max-w-sm h-96 relative group">
             <div className="absolute inset-0 bg-[#818cf8]/30 rounded-3xl transform translate-y-4 translate-x-4 transition-all duration-500 group-focus-within:translate-y-5 group-focus-within:translate-x-5 group-focus-within:bg-[#818cf8]/50 group-hover:bg-[#818cf8]/40 shadow-[0_0_30px_rgba(129,140,248,0.25)]"></div>
             {/* Text Box with light blue border default, rich blue hover */}
             <textarea 
               className="absolute inset-0 w-full h-full bg-[#151720] border-2 border-[#a5b4fc]/50 p-6 rounded-3xl text-[#e0e7ff] outline-none resize-none transition-all duration-300 focus:border-[#818cf8] focus:bg-[#1a1c2e] focus:shadow-[0_0_20px_rgba(129,140,248,0.3)] hover:border-[#818cf8]/80 placeholder-[#818cf8]/50 font-mono" 
               placeholder="Type or paste your secret message here..." 
               value={text} 
               onChange={(e) => setText(e.target.value)} 
             />
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Typography & Settings */}
      <div className="w-full lg:w-1/2 space-y-8 mt-4 lg:mt-0">
        <div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Share files securely.</h1>
          <p className="text-gray-400 leading-relaxed text-lg max-w-md">
            Simplify the way you share confidential files and secret texts. Our platform offers a seamless, zero-trace solution for your privacy needs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div className="bg-[#25262b] p-4 rounded-2xl border border-[#373a40]">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Password</label>
            <input type="password" placeholder="(Optional)" className="w-full bg-[#1a1b1e] border border-[#373a40] p-2.5 rounded-xl text-white outline-none focus:border-[#818cf8] transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          
          <div className="bg-[#25262b] p-4 rounded-2xl border border-[#373a40]">
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Max Views</label>
            <input 
              type="number" 
              min="1"
              placeholder="Unlimited" 
              className="w-full bg-[#1a1b1e] border border-[#373a40] p-2.5 rounded-xl text-white outline-none focus:border-[#818cf8] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
              value={maxViews} 
              onKeyDown={(e) => {
                if (['-', '.', 'e', 'E'].includes(e.key)) e.preventDefault();
              }}
              onChange={e => setMaxViews(e.target.value)} 
            />
          </div>
        </div>

        <div className="max-w-md">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Self-Destruct Timer</label>
          <select value={expiryPreset} onChange={(e) => setExpiryPreset(e.target.value === 'custom' ? 'custom' : Number(e.target.value))} className="w-full bg-[#25262b] border border-[#373a40] p-3.5 rounded-2xl text-white outline-none focus:border-[#818cf8] appearance-none font-medium transition-colors cursor-pointer">
            <option value={10}>⚡ 10 Seconds</option>
            <option value={600}>⏱️ 10 Minutes</option>
            <option value={3600}>⏳ 1 Hour</option>
            {isLoggedIn && <><option value={86400}>📅 1 Day</option><option value="custom">⚙️ Custom Date & Time...</option></>}
          </select>
          {expiryPreset === 'custom' && isLoggedIn && (
            <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
              <input type="date" min={new Date().toISOString().split('T')[0]} value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="flex-[3] bg-[#25262b] border border-[#373a40] p-3 rounded-xl text-white outline-none focus:border-[#818cf8] transition-colors cursor-pointer" />
              <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="flex-[2] bg-[#25262b] border border-[#373a40] p-3 rounded-xl text-white outline-none focus:border-[#818cf8] transition-colors cursor-pointer" />
            </div>
          )}
        </div>

        {error && <div className="max-w-md p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

        {/* --- THE CREATE BUTTON (NEVER VANISHES) --- */}
        <button onClick={handleUpload} disabled={loading} className={`w-full max-w-md py-4 rounded-2xl text-white font-bold text-lg shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${loading ? 'bg-[#4f46e5]/50' : 'bg-[#4f46e5] hover:bg-blue-600 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]'}`}>
          {loading ? 'Generating...' : 'Create Secure Link'}
        </button>

        {/* --- THE RESULT UI BOX --- */}
        {generatedLink && (
          <div className="max-w-md bg-[#25262b] border border-[#373a40] p-5 rounded-2xl animate-in fade-in mt-6">
             <div className="flex justify-between items-center mb-4">
                <p className="text-white font-bold">{isDead ? '💀 Link Destroyed' : '🎉 Link Ready!'}</p>
                
                {/* --- The Link Deleted Badge --- */}
                {isDead ? (
                  <div className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg tracking-wide uppercase">
                    Link Deleted
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-[#1a1b1e] border border-[#373a40] px-3 py-1 rounded-lg text-xs font-mono text-[#818cf8]">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-[#818cf8] opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-[#4f46e5]"></span></span>
                    Views: {liveViews} {maxViews ? `/ ${maxViews}` : ''} | {formatCountdown(timeLeft)}
                  </div>
                )}
             </div>

             <div className="flex gap-2 mb-4">
               <input readOnly value={generatedLink} className={`flex-1 bg-[#1a1b1e] border border-[#373a40] p-2.5 rounded-lg text-sm font-mono outline-none ${isDead ? 'text-gray-600 line-through' : 'text-gray-300'}`} />
               <CopyButton text={generatedLink} disabled={isDead} />
             </div>

             {deleteToken && !isDead && (
               <div className="pt-2 border-t border-[#373a40] mt-3">
                 <button onClick={() => { confirmDelete ? handleEmergencyDelete() : setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }} className={`w-full py-2.5 font-bold rounded-xl text-sm transition-all duration-300 ${confirmDelete ? 'bg-red-600 text-white animate-pulse' : 'bg-[#1a1b1e] text-red-500 hover:bg-red-600 hover:text-white border border-[#373a40]'}`}>
                   {confirmDelete ? 'Confirm Destroy?' : 'Destroy Link Now'}
                 </button>
                 <p className="text-center text-[10px] text-gray-500 mt-2 font-medium">
                   {isLoggedIn ? "You can also manage this link later from your Dashboard." : "Leave this page, and the link will self-destruct when the timer runs out."}
                 </p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}