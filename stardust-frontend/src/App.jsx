import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PostAd from './pages/PostAd';
import Dashboard from './pages/Dashboard';
import AdsList from './pages/AdsList';
import ApiTest from './pages/ApiTest';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/ads" element={<AdsList />} />
              <Route path="/search" element={<AdsList />} />
              <Route path="/category/:categorySlug" element={<AdsList />} />
              <Route path="/category/:categorySlug/:subcategorySlug" element={<AdsList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-ads"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/post-ad"
                element={
                  <ProtectedRoute>
                    <PostAd />
                  </ProtectedRoute>
                }
              />
              <Route path="/api-test" element={<ApiTest />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;