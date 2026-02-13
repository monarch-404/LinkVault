import { Routes, Route, Link } from 'react-router-dom'; // Removed BrowserRouter
import UploadForm from './components/UploadForm';
import ViewContent from './pages/ViewContent';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    // <Router> was removed here because main.tsx already provides it
    <div className="min-h-screen bg-gray-100">
      {/* Simple Navbar */}
      <nav className="bg-white shadow p-4 mb-8">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">LinkVault Pro</Link>
          <div className="space-x-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">Upload</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
            <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Login</Link>
          </div>
        </div>
      </nav>

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