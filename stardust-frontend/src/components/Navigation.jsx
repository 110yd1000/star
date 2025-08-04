import React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, LogIn, UserPlus, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.full_name || user.first_name || user.email || 'User';
  };

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-900 transition-all duration-200"
            >
              Stardust Classifieds
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Home Link */}
            <Link
              to="/"
              className="text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Home
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ads..."
                  className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors duration-200"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </form>

            {/* Authentication & Actions */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Post Ad Button */}
                <Link
                  to="/post-ad"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post Ad
                </Link>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    <User className="w-4 h-4" />
                    <span className="max-w-32 truncate">{getUserDisplayName()}</span>
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/my-ads"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-200"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Ads
                      </Link>
                      <hr className="my-1 border-slate-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors duration-200"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="text-slate-700 hover:text-blue-600 p-2 rounded-md transition-colors duration-200"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-slate-200 py-4">
            <div className="space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="px-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ads..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                  />
                  <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </form>

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link
                  to="/"
                  className="block px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors duration-200"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Home
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/post-ad"
                      className="block px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-md transition-colors duration-200"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Post Ad
                    </Link>
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors duration-200"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/my-ads"
                      className="block px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors duration-200"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      My Ads
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors duration-200"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <LogIn className="w-4 h-4 inline mr-2" />
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-md transition-colors duration-200"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <UserPlus className="w-4 h-4 inline mr-2" />
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
};

export default Navigation;