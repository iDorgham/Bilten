import { renderHook, act } from '@testing-library/react';

// Mock useAuth so we can control authentication state
jest.mock('../../context/AuthContext', () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

import { useAuth } from '../../context/AuthContext';
import { useBasket } from '../useBasket';

describe('useBasket', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  test('adds, updates, removes items for guest using localStorage', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    const { result } = renderHook(() => useBasket());

    act(() => {
      result.current.addToBasket({ id: 'e1' }, 'GA', 2, 10);
    });
    expect(result.current.getTotalItems()).toBe(2);
    expect(result.current.getTotalPrice()).toBe(20);

    const saved = JSON.parse(localStorage.getItem('basket'));
    expect(Array.isArray(saved)).toBe(true);
    const itemId = saved[0].id;

    act(() => {
      result.current.updateQuantity(itemId, 3);
    });
    expect(result.current.getTotalItems()).toBe(3);
    expect(result.current.getTotalPrice()).toBe(30);

    act(() => {
      result.current.removeFromBasket(itemId);
    });
    expect(result.current.getTotalItems()).toBe(0);
    expect(result.current.getTotalPrice()).toBe(0);
  });

  test('clearBasket removes basket for guest from localStorage', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    const { result } = renderHook(() => useBasket());
    act(() => {
      result.current.addToBasket({ id: 'e1' }, 'GA', 1, 5);
    });
    expect(localStorage.getItem('basket')).toBeTruthy();
    act(() => result.current.clearBasket());
    expect(localStorage.getItem('basket')).toBeNull();
  });
});


