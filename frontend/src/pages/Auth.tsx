import { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState(''); // New State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading State
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Start loading
    
    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        if (!name.trim()) throw new Error("Name is required");
        res = await api.register(email, password, name);
      }

      // Save Data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userName', res.data.user.name || 'User'); // Save Name
      
      // Slight delay to show the "Success" state before redirecting (UX polish)
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
      setIsLoading(false); // Stop loading on error
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white shadow-xl rounded-xl transition-all">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        {isLogin ? 'Welcome Back' : 'Join LinkVault'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field (Only for Signup) */}
        {!isLogin && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="password" 
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {/* Inline Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className={`w-full py-3 text-white font-bold rounded-lg transition-all flex justify-center items-center ${
            isLoading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            isLogin ? 'Login' : 'Create Account'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        {isLogin ? "New to LinkVault? " : "Already have an account? "}
        <button 
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setName('');
          }} 
          className="text-blue-600 font-bold hover:underline"
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </button>
      </p>
    </div>
  );
}