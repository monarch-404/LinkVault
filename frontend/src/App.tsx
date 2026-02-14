import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import UploadForm from './components/UploadForm';
import ViewContent from './pages/ViewContent';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { api } from './services/api';

// Create a separate component for Navbar so it can use hooks like useLocation/useNavigate
function Navbar() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName'); // Get Name
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow p-4 mb-8">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          🔒 LinkVault Pro
        </Link>
        <div className="space-x-4 flex items-center">
          <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Upload</Link>
          
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium">Dashboard</Link>
              <div className="hidden md:inline-block h-6 w-px bg-gray-300 mx-2"></div>
              <span className="text-gray-800 font-semibold">Hi, {userName}</span>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow">
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
    <div className="min-h-screen bg-gray-100">
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