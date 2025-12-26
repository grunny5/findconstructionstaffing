/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import {
  useConversationRealtime,
  type Message,
} from '../useConversationRealtime';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client');

describe('useConversationRealtime', () => {
  let mockChannel: any;
  let mockSupabase: any;
  let subscribeCallback: ((status: string) => void) | null;

  beforeEach(() => {
    jest.clearAllMocks();
    subscribeCallback = null;

    // Mock channel with event listeners
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn((callback) => {
        subscribeCallback = callback;
        return mockChannel;
      }),
    };

    // Mock Supabase client
    mockSupabase = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue(undefined),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Subscription Setup', () => {
    it('should create channel with correct conversation ID', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      expect(mockSupabase.channel).toHaveBeenCalledWith(
        `conversation:${conversationId}`
      );
    });

    it('should subscribe to INSERT events on messages table', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      // Find the INSERT subscription
      const insertCall = mockChannel.on.mock.calls.find(
        (call: any) =>
          call[0] === 'postgres_changes' && call[1].event === 'INSERT'
      );

      expect(insertCall).toBeDefined();
      expect(insertCall[1]).toEqual({
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      });
    });

    it('should subscribe to UPDATE events on messages table', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      // Find the UPDATE subscription
      const updateCall = mockChannel.on.mock.calls.find(
        (call: any) =>
          call[0] === 'postgres_changes' && call[1].event === 'UPDATE'
      );

      expect(updateCall).toBeDefined();
      expect(updateCall[1]).toEqual({
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      });
    });

    it('should filter by conversation_id', () => {
      const conversationId = 'specific-conv-id';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      const insertCall = mockChannel.on.mock.calls[0];
      expect(insertCall[1].filter).toBe(`conversation_id=eq.${conversationId}`);
    });

    it('should call subscribe on the channel', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should handle SUBSCRIBED status', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      // Simulate subscription success
      if (subscribeCallback) {
        subscribeCallback('SUBSCRIBED');
      }

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Subscribed to conversation')
      );
    });

    it('should handle CHANNEL_ERROR status', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      // Simulate subscription error
      if (subscribeCallback) {
        subscribeCallback('CHANNEL_ERROR');
      }

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error subscribing')
      );
    });

    it('should handle TIMED_OUT status', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      // Simulate subscription timeout
      if (subscribeCallback) {
        subscribeCallback('TIMED_OUT');
      }

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Subscription timeout')
      );
    });
  });

  describe('Message Events', () => {
    it('should call onMessage when INSERT event fires', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      // Find the INSERT handler
      const insertCall = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'INSERT'
      );
      const insertHandler = insertCall[2];

      // Simulate new message
      const newMessage: Message = {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'user-1',
        content: 'Hello!',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      };

      insertHandler({ new: newMessage });

      expect(onMessage).toHaveBeenCalledWith(newMessage);
      expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('should call onMessage when UPDATE event fires', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      // Find the UPDATE handler
      const updateCall = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'UPDATE'
      );
      const updateHandler = updateCall[2];

      // Simulate updated message
      const updatedMessage: Message = {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'user-1',
        content: 'Edited content',
        created_at: new Date().toISOString(),
        edited_at: new Date().toISOString(),
        deleted_at: null,
      };

      updateHandler({ new: updatedMessage });

      expect(onMessage).toHaveBeenCalledWith(updatedMessage);
    });

    it('should call onMessage with correct payload data', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      const insertHandler = mockChannel.on.mock.calls[0][2];

      const message: Message = {
        id: 'test-id',
        conversation_id: 'test-conv',
        sender_id: 'test-sender',
        content: 'Test message',
        created_at: '2024-01-01T00:00:00Z',
        edited_at: null,
        deleted_at: null,
      };

      insertHandler({ new: message });

      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          conversation_id: 'test-conv',
          sender_id: 'test-sender',
          content: 'Test message',
        })
      );
    });

    it('should handle multiple messages correctly', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      const insertHandler = mockChannel.on.mock.calls[0][2];

      const message1: Message = {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'user-1',
        content: 'First',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      };

      const message2: Message = {
        id: 'msg-2',
        conversation_id: conversationId,
        sender_id: 'user-2',
        content: 'Second',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      };

      insertHandler({ new: message1 });
      insertHandler({ new: message2 });

      expect(onMessage).toHaveBeenCalledTimes(2);
      expect(onMessage).toHaveBeenNthCalledWith(1, message1);
      expect(onMessage).toHaveBeenNthCalledWith(2, message2);
    });

    it('should handle deleted messages (UPDATE event)', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      const updateHandler = mockChannel.on.mock.calls.find(
        (call: any) => call[1].event === 'UPDATE'
      )[2];

      const deletedMessage: Message = {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'user-1',
        content: 'Deleted content',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: new Date().toISOString(),
      };

      updateHandler({ new: deletedMessage });

      expect(onMessage).toHaveBeenCalledWith(deletedMessage);
      expect(onMessage.mock.calls[0][0].deleted_at).not.toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should remove channel on unmount', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      const { unmount } = renderHook(() =>
        useConversationRealtime(conversationId, onMessage)
      );

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('should remove channel when conversationId changes', () => {
      const onMessage = jest.fn();

      const { rerender } = renderHook(
        ({ conversationId }) =>
          useConversationRealtime(conversationId, onMessage),
        { initialProps: { conversationId: 'conv-1' } }
      );

      // Change conversation ID
      rerender({ conversationId: 'conv-2' });

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
      expect(mockSupabase.channel).toHaveBeenCalledWith('conversation:conv-2');
    });

    it('should log successful cleanup', async () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      const { unmount } = renderHook(() =>
        useConversationRealtime(conversationId, onMessage)
      );

      unmount();

      // Wait for promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Unsubscribed from conversation')
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      // Mock removeChannel to reject
      mockSupabase.removeChannel.mockRejectedValue(new Error('Cleanup failed'));

      const { unmount } = renderHook(() =>
        useConversationRealtime(conversationId, onMessage)
      );

      unmount();

      // Wait for promise to reject
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error removing channel'),
        expect.any(Error)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should skip subscription when conversationId is empty', () => {
      const onMessage = jest.fn();

      renderHook(() => useConversationRealtime('', onMessage));

      expect(mockSupabase.channel).not.toHaveBeenCalled();
    });

    it('should handle setup errors gracefully', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn();

      // Mock channel to throw error
      mockSupabase.channel.mockImplementation(() => {
        throw new Error('Channel creation failed');
      });

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set up subscription'),
        expect.any(Error)
      );
    });

    it('should work with different callback functions', () => {
      const conversationId = 'conv-123';
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const { rerender } = renderHook(
        ({ cb }) => useConversationRealtime(conversationId, cb),
        { initialProps: { cb: callback1 } }
      );

      const insertHandler = mockChannel.on.mock.calls[0][2];
      const message: Message = {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'user-1',
        content: 'Test',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      };

      insertHandler({ new: message });
      expect(callback1).toHaveBeenCalledWith(message);

      // Changing callback should trigger cleanup and re-subscription
      rerender({ cb: callback2 });

      expect(mockSupabase.removeChannel).toHaveBeenCalled();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should accept valid Message type', () => {
      const conversationId = 'conv-123';
      const onMessage = jest.fn((message: Message) => {
        // TypeScript should infer correct type
        expect(message).toHaveProperty('id');
        expect(message).toHaveProperty('conversation_id');
        expect(message).toHaveProperty('sender_id');
        expect(message).toHaveProperty('content');
        expect(message).toHaveProperty('created_at');
      });

      renderHook(() => useConversationRealtime(conversationId, onMessage));

      const insertHandler = mockChannel.on.mock.calls[0][2];

      const message: Message = {
        id: 'msg-1',
        conversation_id: conversationId,
        sender_id: 'user-1',
        content: 'Test',
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
      };

      insertHandler({ new: message });

      expect(onMessage).toHaveBeenCalledWith(message);
    });
  });
});
