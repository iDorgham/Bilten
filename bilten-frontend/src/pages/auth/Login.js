import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import SocialButton from '../../components/SocialButton';

const Login = () => {
  const { login } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError('');
    
    try {
      // TODO: Implement actual social login logic
      console.log(`Logging in with ${provider}`);
      
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to home page (replace with actual social login logic)
      navigate('/');
    } catch (error) {
      setError(`Failed to log in with ${provider}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-transparent py-12 px-4 sm:px-6 lg:px-8 login-container" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('login.title')}
          </h2>
        </div>
        <form className="mt-8 space-y-6 login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('login.emailLabel')}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={t('login.emailPlaceholder')}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 dark:focus:ring-blue-400 focus:border-primary-500 dark:focus:border-blue-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('login.passwordLabel')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder={t('login.passwordPlaceholder')}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-primary-500 dark:focus:ring-blue-400 focus:border-primary-500 dark:focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 dark:text-blue-400 hover:text-primary-500 dark:hover:text-blue-300">
                {t('login.forgotPassword')}
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 dark:bg-blue-600 hover:bg-primary-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 dark:bg-transparent text-gray-500 dark:text-gray-400">
                  {t('login.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <SocialButton
                provider="google"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
              />
              <SocialButton
                provider="facebook"
                onClick={() => handleSocialLogin('facebook')}
                disabled={loading}
              />
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="font-medium text-primary-600 dark:text-blue-400 hover:text-primary-500 dark:hover:text-blue-300">
                {t('login.signUp')}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
