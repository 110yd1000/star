import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Calendar, MapPin, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    paused: 0
  });

  useEffect(() => {
    fetchUserAds();
  }, []);

  const fetchUserAds = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserAds();
      if (response.ok) {
        const data = await response.json();
        // Handle both paginated and non-paginated responses
        const adsData = data.data || data;
        setAds(adsData);
        
        // Calculate stats
        const total = adsData.length;
        const active = adsData.filter(ad => ad.status === 'active').length;
        const pending = adsData.filter(ad => ad.status === 'pending_approval').length;
        const paused = adsData.filter(ad => ad.status === 'paused').length;
        
        setStats({ total, active, pending, paused });
      } else {
        setError('Failed to load your ads');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching user ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        const response = await apiService.deleteAd(adId);
        if (response.ok) {
          setAds(ads.filter(ad => ad.id !== adId));
        } else {
          alert('Failed to delete ad');
        }
      } catch (err) {
        alert('Error deleting ad');
      }
    }
  };

  const handleToggleAdStatus = async (adId, currentStatus) => {
    try {
      let response;
      if (currentStatus === 'active') {
        response = await apiService.deactivateAd(adId);
      } else if (currentStatus === 'paused') {
        response = await apiService.reactivateAd(adId);
      }
      
      if (response && response.ok) {
        fetchUserAds(); // Refresh the list
      } else {
        alert('Failed to update ad status');
      }
    } catch (err) {
      alert('Error updating ad status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      pending_approval: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      paused: { color: 'bg-gray-100 text-gray-800', text: 'Paused' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      expired: { color: 'bg-red-100 text-red-800', text: 'Expired' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUserAds}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-slate-600">Welcome back, {user?.full_name || 'User'}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Total Ads</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Pending</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Paused</p>
                <p className="text-2xl font-semibold text-slate-900">{stats.paused}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <Link
            to="/post-ad"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post New Ad
          </Link>
        </div>

        {/* Ads List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">Your Ads</h2>
          </div>
          
          {ads.length === 0 ? (
            <div className="text-center py-12">
              <Plus className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-4">You haven't posted any ads yet.</p>
              <Link
                to="/post-ad"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post Your First Ad
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {ads.map((ad) => (
                <div key={ad.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-slate-900 truncate">
                          {ad.title}
                        </h3>
                        {getStatusBadge(ad.status)}
                      </div>
                      
                      <div className="mt-2 flex items-center text-sm text-slate-500 space-x-4">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {ad.currency_symbol}{ad.price}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {ad.city_name}, {ad.province_name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(ad.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {ad.views} views
                        </div>
                      </div>
                      
                      <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                        {ad.description}
                      </p>
                    </div>
                    
                    <div className="ml-6 flex items-center space-x-2">
                      {ad.status === 'active' && (
                        <button
                          onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                          className="text-yellow-600 hover:text-yellow-900 text-sm"
                        >
                          Pause
                        </button>
                      )}
                      {ad.status === 'paused' && (
                        <button
                          onClick={() => handleToggleAdStatus(ad.id, ad.status)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Activate
                        </button>
                      )}
                      <Link
                        to={`/ad/${ad.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/edit-ad/${ad.id}`}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;