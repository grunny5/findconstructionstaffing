import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../use-toast';

// Import implementation constants if they were exported
// Since they're not exported, we define them here to match the implementation
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000; // Must match the value in use-toast.ts

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should initialize with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      const { id } = result.current.toast({
        title: 'Test Toast',
        description: 'This is a test',
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        id,
        title: 'Test Toast',
        description: 'This is a test',
      });
    });
  });

  it('should add multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
      result.current.toast({ title: 'Toast 3' });
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].title).toBe('Toast 1');
    expect(result.current.toasts[1].title).toBe('Toast 2');
    expect(result.current.toasts[2].title).toBe('Toast 3');
  });

  it('should dismiss a toast by id', () => {
    const { result } = renderHook(() => useToast());
    let toastId: string;

    act(() => {
      const { id } = result.current.toast({ title: 'Test Toast' });
      toastId = id;
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('should update a toast', () => {
    const { result } = renderHook(() => useToast());
    let toastResult: ReturnType<typeof result.current.toast>;

    act(() => {
      toastResult = result.current.toast({ title: 'Original Title' });
    });

    act(() => {
      toastResult!.update({
        id: toastResult!.id,
        title: 'Updated Title',
        description: 'Now with description',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      id: toastResult!.id,
      title: 'Updated Title',
      description: 'Now with description',
    });
  });

  it('should handle toast variants', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Default Toast',
      });

      result.current.toast({
        title: 'Destructive Toast',
        variant: 'destructive',
      });
    });

    expect(result.current.toasts[0].variant).toBeUndefined();
    expect(result.current.toasts[1].variant).toBe('destructive');
  });

  it('should handle toast with action', () => {
    const { result } = renderHook(() => useToast());
    const mockAction = React.createElement(
      'button',
      {
        onClick: jest.fn(),
      },
      'Undo'
    );

    act(() => {
      result.current.toast({
        title: 'Toast with Action',
        action: mockAction as any,
      });
    });

    expect(result.current.toasts[0].action).toBeDefined();
  });

  it('should limit number of toasts to TOAST_LIMIT', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    // Should only keep the most recent toast
    expect(result.current.toasts).toHaveLength(TOAST_LIMIT);
    expect(result.current.toasts[0].title).toBe('Toast 2');
  });

  it('should remove toast from state after dismiss and delay', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);
    const toastId = result.current.toasts[0].id;

    // Dismiss the toast
    act(() => {
      result.current.dismiss(toastId);
    });

    // Toast should be marked as closed but still in the array
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].open).toBe(false);

    // Fast-forward time to trigger removal from state
    // Using TOAST_REMOVE_DELAY constant defined at the top of this file
    act(() => {
      jest.advanceTimersByTime(TOAST_REMOVE_DELAY);
    });

    // Toast should be removed from state
    expect(result.current.toasts).toHaveLength(0);
  });

  it('should generate unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast());
    const ids = new Set<string>();

    act(() => {
      for (let i = 0; i < 5; i++) {
        const { id } = result.current.toast({ title: `Toast ${i}` });
        ids.add(id);
      }
    });

    // All IDs should be unique
    expect(ids.size).toBe(5);
  });
});
