import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PostAd from './pages/PostAd';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/post-ad" 
          element={
            <ProtectedRoute>
              <PostAd />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
