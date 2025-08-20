import { useState, useEffect, useCallback } from 'react';
import { wishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const useWishlist = () => {
  const { isAuthenticated, user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if an event is wishlisted
  const isWishlisted = useCallback((eventId) => {
    return wishlistStatus[eventId] || false;
  }, [wishlistStatus]);

  // Add event to wishlist
  const addToWishlist = useCallback(async (eventId) => {
    if (!isAuthenticated) {
      setError('Please login to add events to wishlist');
      return { success: false, message: 'Authentication required' };
    }

    // Optimistic update
    setWishlistStatus(prev => ({ ...prev, [eventId]: true }));
    setLoading(true);
    setError(null);

    try {
      const response = await wishlistAPI.addToWishlist(eventId);
      
      if (response.data.success) {
        // Update wishlist status
        setWishlistStatus(prev => ({ ...prev, [eventId]: true }));
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      // Rollback optimistic update
      setWishlistStatus(prev => ({ ...prev, [eventId]: false }));
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add to wishlist';
      setError(errorMessage);
      
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Remove event from wishlist
  const removeFromWishlist = useCallback(async (eventId) => {
    if (!isAuthenticated) {
      setError('Please login to manage wishlist');
      return { success: false, message: 'Authentication required' };
    }

    // Optimistic update
    setWishlistStatus(prev => ({ ...prev, [eventId]: false }));
    setLoading(true);
    setError(null);

    try {
      const response = await wishlistAPI.removeFromWishlist(eventId);
      
      if (response.data.success) {
        // Update wishlist status
        setWishlistStatus(prev => ({ ...prev, [eventId]: false }));
        
        // Remove from wishlist array if it exists
        setWishlist(prev => prev.filter(item => item.id !== eventId));
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      // Rollback optimistic update
      setWishlistStatus(prev => ({ ...prev, [eventId]: true }));
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to remove from wishlist';
      setError(errorMessage);
      
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Toggle wishlist status
  const toggleWishlist = useCallback(async (eventId) => {
    const currentStatus = isWishlisted(eventId);
    
    if (currentStatus) {
      return await removeFromWishlist(eventId);
    } else {
      return await addToWishlist(eventId);
    }
  }, [isWishlisted, addToWishlist, removeFromWishlist]);

  // Fetch user's complete wishlist
  const fetchWishlist = useCallback(async (page = 1, limit = 12) => {
    if (!isAuthenticated) {
      return { success: false, message: 'Authentication required' };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await wishlistAPI.getWishlist({ page, limit });
      
      if (response.data.success) {
        const wishlistData = response.data.data.wishlist;
        setWishlist(wishlistData);
        
        // Update wishlist status for these events
        const statusUpdates = {};
        wishlistData.forEach(item => {
          statusUpdates[item.id] = true;
        });
        setWishlistStatus(prev => ({ ...prev, ...statusUpdates }));
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch wishlist';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Check wishlist status for multiple events
  const checkWishlistStatus = useCallback(async (eventIds) => {
    if (!isAuthenticated || !eventIds || eventIds.length === 0) {
      return { success: false, message: 'Authentication required or no events provided' };
    }

    try {
      const response = await wishlistAPI.checkWishlistStatus(eventIds);
      
      if (response.data.success) {
        const statusData = response.data.data;
        setWishlistStatus(prev => ({ ...prev, ...statusData }));
        return { success: true, data: statusData };
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to check wishlist status';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [isAuthenticated]);

  // Clear wishlist state (useful for logout)
  const clearWishlist = useCallback(() => {
    setWishlist([]);
    setWishlistStatus({});
    setError(null);
  }, []);

  // Clear wishlist state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearWishlist();
    }
  }, [isAuthenticated, clearWishlist]);

  return {
    wishlist,
    wishlistStatus,
    loading,
    error,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    fetchWishlist,
    checkWishlistStatus,
    clearWishlist,
  };
};

export default useWishlist;