import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Calendar, Eye, DollarSign, Filter } from 'lucide-react';
import apiService from '../services/api';

const AdsList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    has_next: false,
    has_previous: false
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    subcategory: searchParams.get('subcategory') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    location: searchParams.get('location') || '',
    ad_type: searchParams.get('ad_type') || ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAds();
    fetchCategories();
    fetchLocations();
  }, [searchParams]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(searchParams);
      const response = await apiService.getAds(params);
      
      if (response.ok) {
        const data = await response.json();
        // Handle both paginated and non-paginated responses
        if (data.data) {
          setAds(data.data);
          setPagination(data.pagination);
        } else {
          setAds(data);
        }
      } else {
        setError('Failed to load ads');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await apiService.getLocations();
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
    });
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', filters.search);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      subcategory: '',
      min_price: '',
      max_price: '',
      location: '',
      ad_type: ''
    });
    setSearchParams({});
  };

  const handlePageChange = (newOffset) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('offset', newOffset.toString());
    setSearchParams(newParams);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading ads...</p>
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
            onClick={fetchAds}
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
          <h1 className="text-3xl font-bold text-slate-900">Browse Ads</h1>
          <p className="mt-2 text-slate-600">
            {pagination.total > 0 ? `${pagination.total} ads found` : 'No ads found'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search ads..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ad Type</label>
                  <select
                    value={filters.ad_type}
                    onChange={(e) => handleFilterChange('ad_type', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="for_sale">For Sale</option>
                    <option value="for_rent">For Rent</option>
                    <option value="wanted">Wanted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min Price</label>
                  <input
                    type="number"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Price</label>
                  <input
                    type="number"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    placeholder="Any"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ads Grid */}
        {ads.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No ads found matching your criteria.</p>
            <p className="text-slate-400 mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {ads.map((ad) => (
              <div key={ad.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                {/* Ad Image */}
                <div className="h-48 bg-slate-200 relative">
                  {ad.thumbnail ? (
                    <img
                      src={ad.thumbnail}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Search className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {ad.ad_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Ad Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                    {ad.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {ad.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-lg font-bold text-blue-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {ad.currency_symbol}{ad.price}
                    </div>
                    <div className="flex items-center text-sm text-slate-500">
                      <Eye className="w-4 h-4 mr-1" />
                      {ad.views}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-slate-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1" />
                    {ad.city_name}, {ad.province_name}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(ad.created_at).toLocaleDateString()}
                    </div>
                    <span>{ad.subcategory_name}</span>
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/ad/${ad.id}`}
                      className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow">
            <div className="text-sm text-slate-700">
              Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                disabled={!pagination.has_previous}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                disabled={!pagination.has_next}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsList;