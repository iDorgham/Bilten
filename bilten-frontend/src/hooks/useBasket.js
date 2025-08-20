import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useBasket = () => {
  const { isAuthenticated, user } = useAuth();
  const [basketItems, setBasketItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load basket items from localStorage or API
  const loadBasketItems = useCallback(async () => {
    if (!isAuthenticated) {
      // For non-authenticated users, load from localStorage
      try {
        const savedBasket = localStorage.getItem('basket');
        if (savedBasket) {
          setBasketItems(JSON.parse(savedBasket));
        }
      } catch (err) {
        console.error('Error loading basket from localStorage:', err);
      }
      return;
    }

    // For authenticated users, load from API (mock data for now)
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockBasketItems = [
        {
          id: 1,
          event: {
            id: "550e8400-e29b-41d4-a716-446655440101",
            title: "Artbat - Deep Techno Journey",
            cover_image_url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop",
            start_date: "2024-11-20T18:00:00Z",
            venue_name: "Innovation Hub",
            organizer_first_name: "John",
            organizer_last_name: "Doe",
            category: "business"
          },
          ticket_type_id: "550e8400-e29b-41d4-a716-446655440201",
          ticket_type: "General Admission",
          quantity: 2,
          price_per_ticket: 25.00,
          total_price: 50.00
        },
        {
          id: 2,
          event: {
            id: "550e8400-e29b-41d4-a716-446655440102",
            title: "Amr Diab - The Plateau Concert",
            cover_image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
            start_date: "2024-11-25T19:00:00Z",
            venue_name: "Modern Art Gallery",
            organizer_first_name: "Jane",
            organizer_last_name: "Smith",
            category: "arts"
          },
          ticket_type_id: "550e8400-e29b-41d4-a716-446655440205",
          ticket_type: "VIP Access",
          quantity: 1,
          price_per_ticket: 75.00,
          total_price: 75.00
        }
      ];
      
      setBasketItems(mockBasketItems);
    } catch (err) {
      setError('Failed to load basket items');
      console.error('Error loading basket:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add item to basket
  const addToBasket = useCallback(async (event, ticketType, quantity = 1, pricePerTicket) => {
    const newItem = {
      id: Date.now(), // Temporary ID
      event,
      ticket_type: ticketType,
      quantity,
      price_per_ticket: pricePerTicket,
      total_price: pricePerTicket * quantity
    };

    setBasketItems(prev => {
      const updated = [...prev, newItem];
      // Save to localStorage for non-authenticated users
      if (!isAuthenticated) {
        localStorage.setItem('basket', JSON.stringify(updated));
      }
      return updated;
    });

    return { success: true, data: newItem };
  }, [isAuthenticated]);

  // Remove item from basket
  const removeFromBasket = useCallback((itemId) => {
    setBasketItems(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      // Save to localStorage for non-authenticated users
      if (!isAuthenticated) {
        localStorage.setItem('basket', JSON.stringify(updated));
      }
      return updated;
    });
  }, [isAuthenticated]);

  // Update item quantity
  const updateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromBasket(itemId);
      return;
    }
    
    setBasketItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity, total_price: item.price_per_ticket * newQuantity }
          : item
      );
      // Save to localStorage for non-authenticated users
      if (!isAuthenticated) {
        localStorage.setItem('basket', JSON.stringify(updated));
      }
      return updated;
    });
  }, [isAuthenticated, removeFromBasket]);

  // Clear basket
  const clearBasket = useCallback(() => {
    setBasketItems([]);
    if (!isAuthenticated) {
      localStorage.removeItem('basket');
    }
  }, [isAuthenticated]);

  // Get total price
  const getTotalPrice = useCallback(() => {
    return basketItems.reduce((total, item) => total + item.total_price, 0);
  }, [basketItems]);

  // Get total items count
  const getTotalItems = useCallback(() => {
    return basketItems.reduce((total, item) => total + item.quantity, 0);
  }, [basketItems]);

  // Load basket items on mount and when authentication changes
  useEffect(() => {
    loadBasketItems();
  }, [loadBasketItems]);

  // Clear basket when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearBasket();
    }
  }, [isAuthenticated, clearBasket]);

  return {
    basketItems,
    loading,
    error,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    clearBasket,
    getTotalPrice,
    getTotalItems,
    loadBasketItems,
  };
};
