import { useState } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      let res;
      if (isLogin) {
        res = await api.login(email, password);
      } else {
        res = await api.register(email, password);
      }

      // Save Token & Redirect
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userEmail', email);
      alert(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard'); // Go to Dashboard after login

    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white shadow-xl rounded-xl">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        {isLogin ? 'Welcome Back' : 'Create Account'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={e => setEmail(e.target.value)}
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
          />
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center mt-4 text-gray-600">
        {isLogin ? "New here? " : "Already have an account? "}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="text-blue-600 font-bold hover:underline"
        >
          {isLogin ? 'Create Account' : 'Login'}
        </button>
      </p>
    </div>
  );
}