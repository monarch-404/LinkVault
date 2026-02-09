import { Routes, Route } from 'react-router-dom';
import UploadForm from './components/UploadForm';
import ViewContent from './pages/ViewContent';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-blue-600 mb-8">LinkVault</h1>
      
      <Routes>
        {/* Home Page: Upload Form */}
        <Route path="/" element={<UploadForm />} />
        
        {/* View Page: Shows content based on ID */}
        <Route path="/v/:id" element={<ViewContent />} />
        
        {/* 404 Page (Optional) */}
        <Route path="*" element={<div className="text-red-500">404 - Page Not Found</div>} />
      </Routes>
    </div>
  );
}

export default App;