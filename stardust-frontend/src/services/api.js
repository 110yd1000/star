// Remove the base URL since we'll use full paths for different API sections
class ApiService {
  constructor() {
    // No base URL needed - we'll use the full paths
  }

  async request(endpoint, options = {}) {
    // endpoint should now be the full path like '/api/v1/ads/categories/'
    const url = endpoint;
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

      // Correct Django endpoint for token refresh
      const response = await fetch('/accounts/api/accounts/token/refresh/', {
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

  // Authentication endpoints - using correct Django paths
  async login(credentials) {
    const response = await this.request('/accounts/api/accounts/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
    return response;
  }

  async register(userData) {
    const response = await this.request('/accounts/api/accounts/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
    return response;
  }

  async logout() {
    const response = await this.request('/accounts/api/accounts/logout/', {
      method: 'POST',
    });
    return response;
  }

  async getCurrentUser() {
    const response = await this.request('/accounts/api/accounts/me/');
    return response;
  }

  async updateProfile(profileData) {
    const response = await this.request('/accounts/api/accounts/me/', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
    return response;
  }

  // Categories endpoints - using correct Django v1 API paths
  async getCategories() {
    const response = await this.request('/api/v1/ads/categories/', { skipAuth: true });
    return response;
  }

  async getCategory(slug) {
    const response = await this.request(`/api/v1/ads/categories/${slug}/`, { skipAuth: true });
    return response;
  }

  async getSubcategory(categorySlug, subcategorySlug) {
    const response = await this.request(`/api/v1/ads/categories/${categorySlug}/${subcategorySlug}/`, { skipAuth: true });
    return response;
  }

  // Ads endpoints - using correct Django v1 API paths
  async getAds(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/api/v1/ads/ads/${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint, { skipAuth: true });
    return response;
  }

  async getAd(id) {
    const response = await this.request(`/api/v1/ads/ads/${id}/`, { skipAuth: true });
    return response;
  }

  async createAd(adData) {
    const response = await this.request('/api/v1/ads/ads/', {
      method: 'POST',
      body: JSON.stringify(adData),
    });
    return response;
  }

  async updateAd(id, adData) {
    const response = await this.request(`/api/v1/ads/ads/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(adData),
    });
    return response;
  }

  async deleteAd(id) {
    const response = await this.request(`/api/v1/ads/ads/${id}/`, {
      method: 'DELETE',
    });
    return response;
  }

  async getUserAds() {
    const response = await this.request('/api/v1/ads/user/ads/');
    return response;
  }

  // Location endpoints - using correct Django v1 API paths
  async getLocations() {
    const response = await this.request('/api/v1/ads/locations/', { skipAuth: true });
    return response;
  }

  // Legacy methods for backward compatibility
  async getProvinces() {
    // If you have specific province endpoints, update these paths
    const response = await this.request('/api/v1/ads/locations/', { skipAuth: true });
    return response;
  }

  async getCities(provinceId) {
    // If you have specific city endpoints, update these paths
    const response = await this.request(`/api/v1/ads/locations/?province=${provinceId}`, { skipAuth: true });
    return response;
  }

  // Media upload - using correct Django v1 API paths
  async uploadMedia(files, adId) {
    const formData = new FormData();
    
    // Handle multiple files
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('files[]', file);
      });
    } else {
      formData.append('files[]', files);
    }

    const response = await this.request(`/api/v1/ads/ads/${adId}/upload-media/`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    return response;
  }

  // Search - using the correct ads endpoint
  async searchAds(query, filters = {}) {
    const params = { search: query, ...filters };
    return this.getAds(params);
  }

  // Ad actions
  async deactivateAd(id) {
    const response = await this.request(`/api/v1/ads/ads/${id}/deactivate/`, {
      method: 'POST',
    });
    return response;
  }

  async reactivateAd(id) {
    const response = await this.request(`/api/v1/ads/ads/${id}/reactivate/`, {
      method: 'POST',
    });
    return response;
  }

  // Password management
  async changePassword(currentPassword, newPassword) {
    const response = await this.request('/accounts/api/accounts/password/change/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      }),
    });
    return response;
  }

  async resetPassword(phoneOrEmail) {
    const response = await this.request('/accounts/api/accounts/password/reset/', {
      method: 'POST',
      body: JSON.stringify({ phone_or_email: phoneOrEmail }),
      skipAuth: true,
    });
    return response;
  }

  // Email/Phone verification
  async verifyEmail(key) {
    const response = await this.request('/accounts/api/accounts/verify/email/', {
      method: 'POST',
      body: JSON.stringify({ key }),
      skipAuth: true,
    });
    return response;
  }

  async verifyPhone(phone, otp) {
    const response = await this.request('/accounts/api/accounts/verify/phone/', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
      skipAuth: true,
    });
    return response;
  }
}

export default new ApiService();