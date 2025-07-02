import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../use-toast';

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
    let toastId: string;

    act(() => {
      const { id } = result.current.toast({ title: 'Original Title' });
      toastId = id;
    });

    act(() => {
      result.current.toast({
        id: toastId,
        title: 'Updated Title',
        description: 'Now with description',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      id: toastId,
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
    const mockAction = { label: 'Undo', altText: 'Undo action' };

    act(() => {
      result.current.toast({
        title: 'Toast with Action',
        action: mockAction,
      });
    });

    expect(result.current.toasts[0].action).toEqual(mockAction);
  });

  it('should limit number of toasts to TOAST_LIMIT', () => {
    const { result } = renderHook(() => useToast());
    const TOAST_LIMIT = 1; // Based on the hook implementation

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    // Should only keep the most recent toast
    expect(result.current.toasts).toHaveLength(TOAST_LIMIT);
    expect(result.current.toasts[0].title).toBe('Toast 2');
  });

  it('should auto-dismiss toasts after timeout', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Auto-dismiss Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);

    // Fast-forward time to trigger auto-dismiss
    act(() => {
      jest.advanceTimersByTime(5000); // Assuming 5s timeout
    });

    // Toast should be dismissed
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