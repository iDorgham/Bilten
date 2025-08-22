import { renderHook, act, waitFor } from '@testing-library/react';

jest.mock('../../context/AuthContext', () => ({ __esModule: true, useAuth: jest.fn() }));
jest.mock('../../services/api', () => ({
  __esModule: true,
  wishlistAPI: {
    addToWishlist: jest.fn(async (id) => ({ data: { success: true, data: { id } } })),
    removeFromWishlist: jest.fn(async (id) => ({ data: { success: true, data: { id } } })),
    getWishlist: jest.fn(async () => ({ data: { success: true, data: { wishlist: [{ id: 'e1' }, { id: 'e2' }] } } })),
    checkWishlistStatus: jest.fn(async (ids) => ({ data: { success: true, data: Object.fromEntries(ids.map(i => [i, true])) } })),
  }
}));

import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../useWishlist';
import { wishlistAPI } from '../../services/api';

describe('useWishlist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requires auth for add/remove and fetch, sets error for guest', async () => {
    useAuth.mockReturnValue({ isAuthenticated: false, user: null });
    const { result } = renderHook(() => useWishlist());

    let r;
    await act(async () => { r = await result.current.addToWishlist('e1'); });
    expect(r.success).toBe(false);
    await act(async () => { r = await result.current.removeFromWishlist('e1'); });
    expect(r.success).toBe(false);
    await act(async () => { r = await result.current.fetchWishlist(); });
    expect(r.success).toBe(false);
  });

  test('authenticated flow: add then remove (direct calls)', async () => {
    useAuth.mockReturnValue({ isAuthenticated: true, user: { id: 1 } });
    const { result } = renderHook(() => useWishlist());

    // Add then remove e4 directly
    await act(async () => { await result.current.addToWishlist('e4'); });
    expect(wishlistAPI.addToWishlist).toHaveBeenCalledWith('e4');
    await act(async () => { await result.current.removeFromWishlist('e4'); });
    expect(wishlistAPI.removeFromWishlist).toHaveBeenCalledWith('e4');

    // Add then remove e1 directly
    await act(async () => { await result.current.addToWishlist('e1'); });
    await act(async () => { await result.current.removeFromWishlist('e1'); });
    expect(wishlistAPI.removeFromWishlist).toHaveBeenCalledWith('e1');
  });
});


