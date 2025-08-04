import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Tag } from 'lucide-react';
import apiService from '../services/api';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories();
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        setError('Failed to load categories');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading categories...</p>
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
            onClick={fetchCategories}
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find What You're Looking For
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Discover amazing deals and connect with your community through our classified marketplace
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Browse Categories
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Explore our wide range of categories to find exactly what you need
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No categories available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden group"
              >
                {/* Category Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-500">
                    {category.ad_count || 0} {(category.ad_count || 0) === 1 ? 'ad' : 'ads'} available
                  </p>
                </div>

                {/* Subcategories */}
                <div className="p-6">
                  <div className="space-y-3">
                    {(category.subcategories || []).slice(0, 5).map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/category/${category.slug}/${sub.slug}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group/sub"
                      >
                        <span className="text-slate-700 group-hover/sub:text-blue-600 transition-colors">
                          {sub.name}
                        </span>
                        <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {sub.ad_count || 0}
                        </span>
                      </Link>
                    ))}
                    
                    {(category.subcategories || []).length > 5 && (
                      <Link
                        to={`/category/${category.slug}`}
                        className="flex items-center justify-center p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        View all subcategories
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Category Link */}
                <div className="px-6 pb-6">
                  <Link
                    to={`/category/${category.slug}`}
                    className="block w-full text-center py-3 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-medium rounded-lg transition-all duration-200"
                  >
                    View All in {category.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;