import { renderHook, act } from '@testing-library/react';
import { useNotifications } from '../useNotifications';

describe('useNotifications', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('fetches notifications and updates loading state', async () => {
    const { result } = renderHook(() => useNotifications());
    // Effect triggers fetch with 500ms timeout
    expect(result.current.loading).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(500);
      // Allow microtasks to flush
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.notifications.length).toBeGreaterThanOrEqual(5);
    expect(result.current.getUnreadCount()).toBeGreaterThan(0);
  });

  test('markAsRead, markAllAsRead, clearAllRead operate correctly', async () => {
    const { result } = renderHook(() => useNotifications());
    await act(async () => {
      jest.advanceTimersByTime(500);
      await Promise.resolve();
    });

    const initialUnread = result.current.getUnreadCount();
    const firstId = result.current.notifications[0].id;

    act(() => {
      result.current.markAsRead(firstId);
    });
    expect(result.current.getUnreadCount()).toBeLessThan(initialUnread);

    act(() => {
      result.current.markAllAsRead();
    });
    expect(result.current.getUnreadCount()).toBe(0);

    act(() => {
      result.current.clearAllRead();
    });
    expect(result.current.notifications.length).toBe(0);
  });
});


