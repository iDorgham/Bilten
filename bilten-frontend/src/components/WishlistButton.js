import React, { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const WishlistButton = ({ 
  eventId, 
  isWishlisted = false, 
  onToggle, 
  size = 'md', 
  className = '',
  showTooltip = true 
}) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Check authentication
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isLoading || !onToggle) return;

    setIsLoading(true);
    
    try {
      await onToggle(eventId);
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonClasses = `
    ${sizeClasses[size]}
    relative
    rounded-full
    bg-white/90
    backdrop-blur-sm
    border
    border-gray-200
    hover:bg-white
    hover:border-gray-300
    hover:scale-110
    active:scale-95
    transition-all
    duration-200
    shadow-sm
    hover:shadow-md
    focus:outline-none
    focus:ring-2
    focus:ring-primary-500
    focus:ring-offset-2
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:scale-100
    ${className}
  `.trim();

  const heartClasses = `
    ${iconSizes[size]}
    transition-all
    duration-200
    ${isWishlisted 
      ? 'text-red-500 drop-shadow-sm' 
      : 'text-gray-600 hover:text-red-400'
    }
    ${isLoading ? 'animate-pulse' : ''}
  `.trim();

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={buttonClasses}
      aria-label={
        isWishlisted 
          ? 'Remove from wishlist' 
          : 'Add to wishlist'
      }
      title={
        showTooltip 
          ? (isWishlisted ? 'Remove from wishlist' : 'Add to wishlist')
          : undefined
      }
    >
      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* Heart icon */}
      <div className={isLoading ? 'opacity-30' : 'opacity-100'}>
        {isWishlisted ? (
          <HeartSolidIcon className={heartClasses} />
        ) : (
          <HeartIcon className={heartClasses} />
        )}
      </div>
    </button>
  );
};

export default WishlistButton;