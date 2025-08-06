import { useState } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import apiService from '../services/api';

const ApiTest = () => {
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);

  const tests = [
    {
      name: 'Health Check',
      test: async () => {
        const response = await fetch('/health/');
        return response.ok;
      }
    },
    {
      name: 'Get Categories',
      test: async () => {
        const response = await apiService.getCategories();
        return response.ok;
      }
    },
    {
      name: 'Get Locations',
      test: async () => {
        const response = await apiService.getLocations();
        return response.ok;
      }
    },
    {
      name: 'Get Ads (Public)',
      test: async () => {
        const response = await apiService.getAds();
        return response.ok;
      }
    },
    {
      name: 'Search Ads',
      test: async () => {
        const response = await apiService.searchAds('test');
        return response.ok;
      }
    }
  ];

  const runTests = async () => {
    setTesting(true);
    const results = {};

    for (const test of tests) {
      try {
        results[test.name] = {
          status: 'running',
          message: 'Testing...'
        };
        setTestResults({ ...results });

        const success = await test.test();
        results[test.name] = {
          status: success ? 'success' : 'error',
          message: success ? 'Passed' : 'Failed'
        };
      } catch (error) {
        results[test.name] = {
          status: 'error',
          message: error.message
        };
      }
      setTestResults({ ...results });
    }

    setTesting(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'running':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">API Integration Test</h1>
          <p className="mt-2 text-slate-600">
            Test the API endpoints to ensure everything is working correctly.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Test Results</h2>
            <button
              onClick={runTests}
              disabled={testing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {testing ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>

          <div className="space-y-4">
            {tests.map((test) => {
              const result = testResults[test.name];
              return (
                <div
                  key={test.name}
                  className={`p-4 rounded-lg border ${
                    result ? getStatusColor(result.status) : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(result?.status)}
                      <span className="font-medium text-slate-900">{test.name}</span>
                    </div>
                    <span className="text-sm text-slate-600">
                      {result?.message || 'Not tested'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Instructions</h3>
          <div className="prose text-slate-600">
            <p>This page tests the core API integrations:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Health Check:</strong> Verifies the backend server is running</li>
              <li><strong>Get Categories:</strong> Tests category data retrieval</li>
              <li><strong>Get Locations:</strong> Tests location data retrieval</li>
              <li><strong>Get Ads:</strong> Tests public ad listing</li>
              <li><strong>Search Ads:</strong> Tests ad search functionality</li>
            </ul>
            <p className="mt-4">
              Click "Run Tests" to verify all API endpoints are working correctly. 
              Green checkmarks indicate successful tests, red X marks indicate failures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;