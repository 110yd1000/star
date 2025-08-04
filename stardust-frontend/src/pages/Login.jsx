import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  
  // Check if we should show register form based on route
  const [isRegistering, setIsRegistering] = useState(location.pathname === '/register');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // email or phone
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Update form mode based on route changes
  useEffect(() => {
    setIsRegistering(location.pathname === '/register');
  }, [location.pathname]);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    // International phone format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const validateIdentifier = (identifier) => {
    if (!identifier) return false;
    return validateEmail(identifier) || validatePhone(identifier);
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate identifier (email or phone)
    if (!formData.identifier) {
      newErrors.identifier = 'Email or phone number is required';
    } else if (!validateIdentifier(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email address or phone number in international format (+1234567890)';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    // Registration-specific validations
    if (isRegistering) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.acceptTerms) {
        newErrors.acceptTerms = 'You must accept the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isRegistering) {
        const userData = {
          email: validateEmail(formData.identifier) ? formData.identifier : null,
          phone_number: validatePhone(formData.identifier) ? formData.identifier : null,
          full_name: `${formData.firstName} ${formData.lastName}`,
          password: formData.password
        };

        const result = await register(userData);
        if (result.success) {
          alert(result.message);
          navigate('/login');
        } else {
          setErrors({ submit: result.error });
        }
      } else {
        const credentials = {
          [validateEmail(formData.identifier) ? 'email' : 'phone']: formData.identifier,
          password: formData.password
        };

        const result = await login(credentials);
        if (result.success) {
          navigate('/');
        } else {
          setErrors({ submit: result.error });
        }
      }
    } catch (error) {
      setErrors({ submit: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = !isRegistering;
    setIsRegistering(newMode);
    navigate(newMode ? '/register' : '/login');
    setErrors({});
    
    if (newMode) {
      // Switching to register mode - keep identifier, clear rest
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        acceptTerms: false
      }));
    } else {
      // Switching to login mode - keep identifier and clear rest
      setFormData(prev => ({
        identifier: prev.identifier,
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        acceptTerms: false
      }));
    }
  };

  const getIdentifierPlaceholder = () => {
    return "Email address or phone (+1234567890)";
  };

  const getIdentifierIcon = () => {
    if (!formData.identifier) return <Mail className="w-5 h-5 text-gray-400" />;
    return validateEmail(formData.identifier) 
      ? <Mail className="w-5 h-5 text-gray-400" />
      : <Phone className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-4 shadow-lg">
            {isRegistering ? <UserPlus className="w-8 h-8 text-white" /> : <User className="w-8 h-8 text-white" />}
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            {isRegistering ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-600 mt-2">
            {isRegistering
              ? 'Sign up to get started with your account'
              : 'Please sign in to your account'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Registration-only fields */}
          {isRegistering && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-slate-50 hover:bg-white ${
                    errors.firstName ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-slate-50 hover:bg-white ${
                    errors.lastName ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
          )}

          {/* Email or Phone field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email or Phone Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getIdentifierIcon()}
              </div>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-slate-50 hover:bg-white ${
                  errors.identifier ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder={getIdentifierPlaceholder()}
              />
            </div>
            {errors.identifier && (
              <p className="text-red-500 text-sm mt-1">{errors.identifier}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-slate-50 hover:bg-white ${
                  errors.password ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                ) : (
                  <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password field (registration only) */}
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-12 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-slate-50 hover:bg-white ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* Terms and conditions (registration only) */}
          {isRegistering && (
            <div>
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:text-blue-800 underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>
              )}
            </div>
          )}

          {/* Submit button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg hover:shadow-xl"
          >
            {loading
              ? (isRegistering ? 'Creating Account...' : 'Signing In...')
              : (isRegistering ? 'Create Account' : 'Sign In')
            }
          </button>

          {/* Error message */}
          {errors.submit && (
            <p className="text-red-500 text-sm text-center">{errors.submit}</p>
          )}
        </div>

        {/* Toggle between login and register */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
          >
            {isRegistering
              ? 'Already have an account? Sign in here'
              : "Don't have an account? Create one here"
            }
          </button>
        </div>

        {/* Forgot password link (login only) */}
        {!isRegistering && (
          <div className="mt-4 text-center">
            <a href="/forgot-password" className="text-sm text-slate-600 hover:text-slate-800 transition-colors duration-200">
              Forgot your password?
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;