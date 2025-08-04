const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token && !options.skipAuth) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      
      // Handle token refresh if needed
      if (response.status === 401 && !options.skipAuth) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          config.headers.Authorization = `Bearer ${localStorage.getItem('authToken')}`;
          return await fetch(url, config);
        }
      }

      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) return false;

      const response = await fetch(`${this.baseURL}/accounts/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.access);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Authentication endpoints
  async login(credentials) {
    const response = await this.request('/accounts/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    return response;
  }

  async register(userData) {
    const response = await this.request('/accounts/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
    return response;
  }

  async logout() {
    const response = await this.request('/accounts/logout/', {
      method: 'POST',
    });
    return response;
  }

  async getCurrentUser() {
    const response = await this.request('/accounts/me/');
    return response;
  }

  async updateProfile(profileData) {
    const response = await this.request('/accounts/me/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    return response;
  }

  // Categories endpoints
  async getCategories() {
    const response = await this.request('/ads/categories/', { skipAuth: true });
    return response;
  }

  async getCategory(slug) {
    const response = await this.request(`/ads/categories/${slug}/`, { skipAuth: true });
    return response;
  }

  async getSubcategory(categorySlug, subcategorySlug) {
    const response = await this.request(`/ads/categories/${categorySlug}/${subcategorySlug}/`, { skipAuth: true });
    return response;
  }

  // Ads endpoints
  async getAds(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/ads/${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint, { skipAuth: true });
    return response;
  }

  async getAd(id) {
    const response = await this.request(`/ads/${id}/`, { skipAuth: true });
    return response;
  }

  async createAd(adData) {
    const response = await this.request('/ads/', {
      method: 'POST',
      body: JSON.stringify(adData),
    });
    return response;
  }

  async updateAd(id, adData) {
    const response = await this.request(`/ads/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(adData),
    });
    return response;
  }

  async deleteAd(id) {
    const response = await this.request(`/ads/${id}/`, {
      method: 'DELETE',
    });
    return response;
  }

  async getUserAds() {
    const response = await this.request('/ads/my-ads/');
    return response;
  }

  // Location endpoints
  async getProvinces() {
    const response = await this.request('/ads/provinces/', { skipAuth: true });
    return response;
  }

  async getCities(provinceId) {
    const response = await this.request(`/ads/provinces/${provinceId}/cities/`, { skipAuth: true });
    return response;
  }

  // Media upload
  async uploadMedia(file, adId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ad', adId);

    const response = await this.request('/ads/media/', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    return response;
  }

  // Search
  async searchAds(query, filters = {}) {
    const params = { search: query, ...filters };
    return this.getAds(params);
  }
}

export default new ApiService();