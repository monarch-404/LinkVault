import { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        if (!name.trim()) throw new Error("Name is required");
        res = await api.register(email, password, name);
      }

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userName', res.data.user.name || 'User');
      
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-[#25262b] shadow-2xl rounded-3xl border border-[#373a40] transition-all">
      <h2 className="text-3xl font-bold text-center mb-8 text-white">
        {isLogin ? 'Welcome Back' : 'Join LinkVault'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {!isLogin && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
            <input 
              type="text" required
              className="w-full p-3 bg-[#1a1b1e] border border-[#373a40] rounded-xl text-white focus:border-[#818cf8] outline-none transition-colors duration-300"
              value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
          <input 
            type="email" required
            className="w-full p-3 bg-[#1a1b1e] border border-[#373a40] rounded-xl text-white focus:border-[#818cf8] outline-none transition-colors duration-300"
            value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
          <input 
            type="password" required
            className="w-full p-3 bg-[#1a1b1e] border border-[#373a40] rounded-xl text-white focus:border-[#818cf8] outline-none transition-colors duration-300"
            value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* --- THE BLUE BUTTON ANIMATION --- */}
        <button 
          type="submit" disabled={isLoading}
          className={`w-full py-4 text-white font-bold rounded-xl transition-all duration-300 transform flex justify-center items-center mt-4 ${
            isLoading ? 'bg-[#4f46e5]/50 cursor-not-allowed' : 'bg-[#4f46e5] hover:bg-blue-600 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]'
          }`}
        >
          {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-400">
        {isLogin ? "New to LinkVault? " : "Already have an account? "}
        <button onClick={() => { setIsLogin(!isLogin); setError(''); setName(''); }} className="text-[#818cf8] font-bold hover:text-blue-400 hover:drop-shadow-[0_0_5px_rgba(96,165,250,0.8)] transition-all duration-300">
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
}