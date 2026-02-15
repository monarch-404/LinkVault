import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import UploadForm from './components/UploadForm';
import ViewContent from './pages/ViewContent';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { api } from './services/api';

function Navbar() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <nav className="p-6 border-b border-[#2f3037] bg-[#1a1b1e] backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        
        {/* The Logo */}
        <Link to="/" className="text-2xl font-extrabold text-white tracking-wider flex items-center gap-1 hover:opacity-80 transition-opacity">
          LinkVault<span className="text-[#4f46e5]">.</span>
        </Link>
        
        <div className="space-x-8 flex items-center text-sm">
          
          {/* Animated Upload Link */}
          <Link to="/" className="relative group text-gray-400 hover:text-white transition-colors duration-300 font-semibold tracking-wide py-1">
            Upload
            {/* The Magic Underline Animation */}
            <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[#818cf8] transition-all duration-300 group-hover:w-full group-hover:left-0 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]"></span>
          </Link>
          
          {isLoggedIn ? (
            <>
              {/* Animated Dashboard Link */}
              <Link to="/dashboard" className="relative group text-gray-400 hover:text-white transition-colors duration-300 font-semibold tracking-wide py-1">
                Dashboard
                <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[#818cf8] transition-all duration-300 group-hover:w-full group-hover:left-0 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.5)]"></span>
              </Link>
              
              <div className="hidden md:inline-block h-5 w-px bg-[#373a40]"></div>
              
              <div className="flex items-center gap-4">
                <span className="text-gray-300 font-medium tracking-wide">
                  Hi, <span className="text-white font-bold">{userName}</span>
                </span>
                <button 
                  onClick={handleLogout} 
                  className="text-gray-500 hover:text-red-400 transition-all duration-300 font-bold tracking-wide hover:-translate-y-0.5"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            /* Premium Login Button */
            <Link to="/login" className="px-6 py-2.5 text-sm bg-white text-black font-extrabold tracking-wide rounded-full hover:bg-[#818cf8] hover:text-white hover:shadow-[0_0_20px_rgba(129,140,248,0.5)] transition-all duration-300 transform hover:-translate-y-1">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-[#1a1b1e] text-white font-sans selection:bg-[#4f46e5]/40">
      <Navbar />
      <Routes>
        <Route path="/" element={<UploadForm />} />
        <Route path="/v/:id" element={<ViewContent />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;