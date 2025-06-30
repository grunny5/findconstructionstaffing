/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Update the value
    rerender({ value: 'updated', delay: 300 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast forward time by 299ms - still not changed
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Fast forward 1 more ms to complete the delay
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel pending updates when value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // First update
    rerender({ value: 'first update', delay: 300 });
    
    // Advance timer by 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });
    
    // Second update before first completes
    rerender({ value: 'second update', delay: 300 });
    
    // Advance timer by 299ms (total 499ms since first update)
    act(() => {
      jest.advanceTimersByTime(299);
    });
    
    // First update should be cancelled, still showing initial
    expect(result.current).toBe('initial');
    
    // Complete the second update delay
    act(() => {
      jest.advanceTimersByTime(1);
    });
    
    // Should show second update, not first
    expect(result.current).toBe('second update');
  });

  it('should use custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 500 });
    
    // Advance by 499ms
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');
    
    // Advance by 1ms more
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should use default delay of 300ms when not specified', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });
    
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');
    
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should handle rapid successive updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      {
        initialProps: { value: 'initial' },
      }
    );

    // Simulate rapid typing
    const updates = ['h', 'he', 'hel', 'hell', 'hello'];
    
    updates.forEach((value, index) => {
      rerender({ value });
      act(() => {
        jest.advanceTimersByTime(50); // Half the debounce delay
      });
      // All intermediate values should still show initial
      expect(result.current).toBe('initial');
    });

    // Complete the final debounce
    act(() => {
      jest.advanceTimersByTime(50);
    });
    
    // Should only show the final value
    expect(result.current).toBe('hello');
  });

  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      {
        initialProps: { value: 'initial' },
      }
    );

    // Trigger a debounce
    rerender({ value: 'updated' });
    
    // Unmount before debounce completes
    unmount();
    
    // Verify clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();
    
    clearTimeoutSpy.mockRestore();
  });
});