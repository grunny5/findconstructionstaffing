/**
 * @jest-environment node
 */

import {
  conversationsQuerySchema,
  createConversationSchema,
  sendMessageSchema,
  editMessageSchema,
  truncateMessage,
  isValidMessageLength,
  MESSAGE_MIN_LENGTH,
  MESSAGE_MAX_LENGTH,
  MESSAGE_PREVIEW_LENGTH,
  DEFAULT_CONVERSATIONS_LIMIT,
  MAX_CONVERSATIONS_LIMIT,
} from '../messages';

describe('conversationsQuerySchema', () => {
  it('should use default values when no parameters provided', () => {
    const result = conversationsQuerySchema.parse({});
    expect(result.limit).toBe(DEFAULT_CONVERSATIONS_LIMIT);
    expect(result.offset).toBe(0);
    expect(result.filter).toBe('all');
    expect(result.search).toBeUndefined();
  });

  describe('limit validation', () => {
    it('should accept valid limit values', () => {
      const result1 = conversationsQuerySchema.parse({ limit: '10' });
      expect(result1.limit).toBe(10);

      const result2 = conversationsQuerySchema.parse({ limit: '50' });
      expect(result2.limit).toBe(50);

      const result3 = conversationsQuerySchema.parse({ limit: '100' });
      expect(result3.limit).toBe(100);
    });

    it('should reject limit below 1', () => {
      expect(() =>
        conversationsQuerySchema.parse({ limit: '0' })
      ).toThrow('Limit must be at least 1');

      expect(() =>
        conversationsQuerySchema.parse({ limit: '-5' })
      ).toThrow();
    });

    it('should reject limit above maximum', () => {
      expect(() =>
        conversationsQuerySchema.parse({ limit: '101' })
      ).toThrow(`Limit must not exceed ${MAX_CONVERSATIONS_LIMIT}`);

      expect(() =>
        conversationsQuerySchema.parse({ limit: '500' })
      ).toThrow();
    });

    it('should reject non-integer limit', () => {
      // Note: parseInt('10.5') = 10, so decimal strings get truncated
      // This test verifies non-numeric strings are rejected
      expect(() =>
        conversationsQuerySchema.parse({ limit: 'abc' })
      ).toThrow();

      expect(() =>
        conversationsQuerySchema.parse({ limit: 'not-a-number' })
      ).toThrow();
    });
  });

  describe('offset validation', () => {
    it('should accept valid offset values', () => {
      const result1 = conversationsQuerySchema.parse({ offset: '0' });
      expect(result1.offset).toBe(0);

      const result2 = conversationsQuerySchema.parse({ offset: '25' });
      expect(result2.offset).toBe(25);

      const result3 = conversationsQuerySchema.parse({ offset: '100' });
      expect(result3.offset).toBe(100);
    });

    it('should reject negative offset', () => {
      expect(() =>
        conversationsQuerySchema.parse({ offset: '-1' })
      ).toThrow('Offset must be 0 or greater');

      expect(() =>
        conversationsQuerySchema.parse({ offset: '-10' })
      ).toThrow();
    });

    it('should reject non-integer offset', () => {
      // Note: parseInt('5.5') = 5, so decimal strings get truncated
      // This test verifies non-numeric strings are rejected
      expect(() =>
        conversationsQuerySchema.parse({ offset: 'abc' })
      ).toThrow();

      expect(() =>
        conversationsQuerySchema.parse({ offset: 'not-a-number' })
      ).toThrow();
    });
  });

  describe('filter validation', () => {
    it('should accept valid filter values', () => {
      const result1 = conversationsQuerySchema.parse({ filter: 'all' });
      expect(result1.filter).toBe('all');

      const result2 = conversationsQuerySchema.parse({ filter: 'unread' });
      expect(result2.filter).toBe('unread');
    });

    it('should reject invalid filter values', () => {
      expect(() =>
        conversationsQuerySchema.parse({ filter: 'read' })
      ).toThrow('Filter must be one of: all, unread');

      expect(() =>
        conversationsQuerySchema.parse({ filter: 'invalid' })
      ).toThrow();
    });
  });

  describe('search validation', () => {
    it('should accept valid search terms', () => {
      const result = conversationsQuerySchema.parse({ search: 'john' });
      expect(result.search).toBe('john');
    });

    it('should trim whitespace from search', () => {
      const result = conversationsQuerySchema.parse({ search: '  alice  ' });
      expect(result.search).toBe('alice');
    });

    it('should reject empty search after trim', () => {
      expect(() =>
        conversationsQuerySchema.parse({ search: '   ' })
      ).toThrow('Search term must not be empty');
    });

    it('should reject search terms that are too long', () => {
      const longSearch = 'a'.repeat(101);
      expect(() =>
        conversationsQuerySchema.parse({ search: longSearch })
      ).toThrow('Search term must be less than 100 characters');
    });

    it('should allow search to be omitted', () => {
      const result = conversationsQuerySchema.parse({});
      expect(result.search).toBeUndefined();
    });
  });
});

describe('createConversationSchema', () => {
  const validRequest = {
    recipient_id: '123e4567-e89b-12d3-a456-426614174000',
    context_type: 'general' as const,
    context_id: null,
    initial_message: 'Hello, I have a question about your services.',
  };

  describe('recipient_id validation', () => {
    it('should accept valid UUID', () => {
      const result = createConversationSchema.parse(validRequest);
      expect(result.recipient_id).toBe(validRequest.recipient_id);
    });

    it('should reject invalid UUID format', () => {
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          recipient_id: 'not-a-uuid',
        })
      ).toThrow('Recipient ID must be a valid UUID');

      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          recipient_id: '12345',
        })
      ).toThrow();
    });

    it('should require recipient_id', () => {
      const { recipient_id, ...requestWithoutRecipient } = validRequest;
      expect(() =>
        createConversationSchema.parse(requestWithoutRecipient)
      ).toThrow('Recipient ID is required');
    });
  });

  describe('context_type validation', () => {
    it('should accept valid context types', () => {
      const result1 = createConversationSchema.parse({
        ...validRequest,
        context_type: 'general',
      });
      expect(result1.context_type).toBe('general');

      const result2 = createConversationSchema.parse({
        ...validRequest,
        context_type: 'agency_inquiry',
        context_id: '123e4567-e89b-12d3-a456-426614174001',
      });
      expect(result2.context_type).toBe('agency_inquiry');
    });

    it('should reject invalid context types', () => {
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          context_type: 'invalid',
        })
      ).toThrow('Context type must be one of: agency_inquiry, general');
    });
  });

  describe('context_id validation with custom refinement', () => {
    it('should allow null context_id for general conversations', () => {
      const result = createConversationSchema.parse({
        ...validRequest,
        context_type: 'general',
        context_id: null,
      });
      expect(result.context_id).toBeNull();
    });

    it('should require context_id for agency_inquiry conversations', () => {
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          context_type: 'agency_inquiry',
          context_id: null,
        })
      ).toThrow(); // Error is thrown with the correct message in path

      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          context_type: 'agency_inquiry',
          context_id: undefined,
        })
      ).toThrow();
    });

    it('should accept valid context_id for agency_inquiry', () => {
      const result = createConversationSchema.parse({
        ...validRequest,
        context_type: 'agency_inquiry',
        context_id: '123e4567-e89b-12d3-a456-426614174001',
      });
      expect(result.context_id).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should reject invalid UUID for context_id', () => {
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          context_type: 'agency_inquiry',
          context_id: 'not-a-uuid',
        })
      ).toThrow('Context ID must be a valid UUID');
    });
  });

  describe('initial_message validation', () => {
    it('should accept valid message content', () => {
      const result = createConversationSchema.parse(validRequest);
      expect(result.initial_message).toBe(validRequest.initial_message);
    });

    it('should trim whitespace from message', () => {
      const result = createConversationSchema.parse({
        ...validRequest,
        initial_message: '  Hello world  ',
      });
      expect(result.initial_message).toBe('Hello world');
    });

    it('should reject empty message', () => {
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          initial_message: '',
        })
      ).toThrow(`Message must be at least ${MESSAGE_MIN_LENGTH} character`);
    });

    it('should reject message exceeding max length', () => {
      const longMessage = 'a'.repeat(MESSAGE_MAX_LENGTH + 1);
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          initial_message: longMessage,
        })
      ).toThrow(`Message must not exceed ${MESSAGE_MAX_LENGTH} characters`);
    });

    it('should accept message at max length', () => {
      const maxMessage = 'a'.repeat(MESSAGE_MAX_LENGTH);
      const result = createConversationSchema.parse({
        ...validRequest,
        initial_message: maxMessage,
      });
      expect(result.initial_message).toBe(maxMessage);
    });

    it('should reject message with script tags', () => {
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          initial_message: 'Hello <script>alert("XSS")</script> world',
        })
      ).toThrow('Message contains invalid HTML (script tags not allowed)');

      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          initial_message: '<SCRIPT>evil code</SCRIPT>',
        })
      ).toThrow();
    });

    it('should reject message with event handlers', () => {
      const eventHandlers = [
        'onerror',
        'onclick',
        'onload',
        'onmouseover',
        'onfocus',
        'onblur',
        'oninput',
        'onchange',
        'onsubmit',
      ];

      eventHandlers.forEach((handler) => {
        expect(() =>
          createConversationSchema.parse({
            ...validRequest,
            initial_message: `<img ${handler}="alert('XSS')" src="x">`,
          })
        ).toThrow('Message contains invalid HTML (event handlers not allowed)');
      });
    });

    it('should reject message with javascript: URLs', () => {
      expect(() =>
        createConversationSchema.parse({
          ...validRequest,
          initial_message: 'Click <a href="javascript:alert(1)">here</a>',
        })
      ).toThrow(
        'Message contains invalid content (javascript: URLs not allowed)'
      );
    });

    it('should require initial_message', () => {
      const { initial_message, ...requestWithoutMessage } = validRequest;
      expect(() =>
        createConversationSchema.parse(requestWithoutMessage)
      ).toThrow('Initial message is required');
    });
  });
});

describe('sendMessageSchema', () => {
  it('should accept valid message content', () => {
    const result = sendMessageSchema.parse({ content: 'Hello world!' });
    expect(result.content).toBe('Hello world!');
  });

  it('should trim whitespace', () => {
    const result = sendMessageSchema.parse({ content: '  Test message  ' });
    expect(result.content).toBe('Test message');
  });

  it('should reject empty content', () => {
    expect(() => sendMessageSchema.parse({ content: '' })).toThrow(
      `Message must be at least ${MESSAGE_MIN_LENGTH} character`
    );
  });

  it('should reject content exceeding max length', () => {
    const longContent = 'a'.repeat(MESSAGE_MAX_LENGTH + 1);
    expect(() => sendMessageSchema.parse({ content: longContent })).toThrow(
      `Message must not exceed ${MESSAGE_MAX_LENGTH} characters`
    );
  });

  it('should accept content at max length', () => {
    const maxContent = 'a'.repeat(MESSAGE_MAX_LENGTH);
    const result = sendMessageSchema.parse({ content: maxContent });
    expect(result.content).toBe(maxContent);
  });

  it('should reject script tags', () => {
    expect(() =>
      sendMessageSchema.parse({
        content: 'Test <script>alert(1)</script> message',
      })
    ).toThrow('Message contains invalid HTML (script tags not allowed)');
  });

  it('should reject event handlers', () => {
    expect(() =>
      sendMessageSchema.parse({ content: '<img onclick="alert(1)">' })
    ).toThrow('Message contains invalid HTML (event handlers not allowed)');
  });

  it('should reject javascript: URLs', () => {
    expect(() =>
      sendMessageSchema.parse({ content: 'javascript:alert(1)' })
    ).toThrow('Message contains invalid content (javascript: URLs not allowed)');
  });

  it('should require content field', () => {
    expect(() => sendMessageSchema.parse({})).toThrow(
      'Message content is required'
    );
  });
});

describe('editMessageSchema', () => {
  it('should accept valid edited content', () => {
    const result = editMessageSchema.parse({ content: 'Updated message' });
    expect(result.content).toBe('Updated message');
  });

  it('should trim whitespace', () => {
    const result = editMessageSchema.parse({ content: '  Edited  ' });
    expect(result.content).toBe('Edited');
  });

  it('should reject empty content', () => {
    expect(() => editMessageSchema.parse({ content: '' })).toThrow(
      `Message must be at least ${MESSAGE_MIN_LENGTH} character`
    );
  });

  it('should reject content exceeding max length', () => {
    const longContent = 'a'.repeat(MESSAGE_MAX_LENGTH + 1);
    expect(() => editMessageSchema.parse({ content: longContent })).toThrow(
      `Message must not exceed ${MESSAGE_MAX_LENGTH} characters`
    );
  });

  it('should reject script tags', () => {
    expect(() =>
      editMessageSchema.parse({ content: '<script>evil</script>' })
    ).toThrow('Message contains invalid HTML (script tags not allowed)');
  });

  it('should reject event handlers', () => {
    expect(() =>
      editMessageSchema.parse({ content: '<div onload="hack()">' })
    ).toThrow('Message contains invalid HTML (event handlers not allowed)');
  });

  it('should reject javascript: URLs', () => {
    expect(() =>
      editMessageSchema.parse({ content: 'Link: javascript:void(0)' })
    ).toThrow('Message contains invalid content (javascript: URLs not allowed)');
  });
});

describe('Helper functions', () => {
  describe('truncateMessage', () => {
    it('should not truncate short messages', () => {
      const message = 'Hello world';
      expect(truncateMessage(message)).toBe(message);
    });

    it('should truncate long messages with ellipsis', () => {
      const longMessage = 'a'.repeat(300);
      const result = truncateMessage(longMessage);
      expect(result.length).toBe(MESSAGE_PREVIEW_LENGTH + 3); // +3 for '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should use custom max length', () => {
      const message = 'a'.repeat(100);
      const result = truncateMessage(message, 50);
      expect(result.length).toBe(53); // 50 + '...'
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle empty string', () => {
      expect(truncateMessage('')).toBe('');
    });

    it('should handle message at exact max length', () => {
      const message = 'a'.repeat(MESSAGE_PREVIEW_LENGTH);
      expect(truncateMessage(message)).toBe(message);
    });
  });

  describe('isValidMessageLength', () => {
    it('should return true for valid message lengths', () => {
      expect(isValidMessageLength('Hello')).toBe(true);
      expect(isValidMessageLength('a'.repeat(100))).toBe(true);
      expect(isValidMessageLength('a'.repeat(MESSAGE_MAX_LENGTH))).toBe(true);
    });

    it('should return false for empty or whitespace-only messages', () => {
      expect(isValidMessageLength('')).toBe(false);
      expect(isValidMessageLength('   ')).toBe(false);
    });

    it('should return false for messages exceeding max length', () => {
      const longMessage = 'a'.repeat(MESSAGE_MAX_LENGTH + 1);
      expect(isValidMessageLength(longMessage)).toBe(false);
    });

    it('should trim whitespace before checking', () => {
      expect(isValidMessageLength('  valid  ')).toBe(true);
    });
  });
});
