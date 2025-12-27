/**
 * MessageInput Component
 *
 * Textarea component for composing and sending messages
 *
 * Features:
 * - Auto-resizing textarea (max 5 rows)
 * - Character counter (10,000 limit)
 * - Keyboard shortcuts (Enter to send, Shift+Enter for newline)
 * - Loading and error states
 * - Disabled state support
 * - Responsive design
 * - Accessibility features
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 10000;

export interface MessageInputProps {
  conversationId: string;
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isEmpty = content.trim().length === 0;
  const canSend = !isEmpty && !isOverLimit && !isLoading && !disabled;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate the number of rows based on scrollHeight
    const computedLineHeight = getComputedStyle(textarea).lineHeight;
    const lineHeight = parseFloat(computedLineHeight);
    const effectiveLineHeight = Number.isNaN(lineHeight) ? 20 : lineHeight;
    const maxRows = 5;
    const maxHeight = effectiveLineHeight * maxRows;

    // Set height to fit content, up to max
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [content]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!canSend) return;

    setIsLoading(true);
    setError(null);

    try {
      await onSend(content.trim());
      setContent('');
      // Refocus textarea after successful send
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter = newline (default behavior)
  };

  return (
    <div className="flex flex-col gap-2 border-t bg-background p-4">
      {/* Error Message */}
      {error && (
        <div
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Textarea */}
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={disabled || isLoading}
            className={cn(
              'min-h-[40px] resize-none',
              isOverLimit && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-label="Message input"
            aria-describedby="char-counter"
          />

          {/* Character Counter */}
          <div
            id="char-counter"
            className={cn(
              'mt-1 text-right text-xs',
              isOverLimit ? 'text-destructive' : 'text-muted-foreground'
            )}
            aria-live="polite"
          >
            {charCount} / {MAX_LENGTH.toLocaleString()}
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Keyboard Hint */}
      <p className="text-xs text-muted-foreground">
        Press <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd> to
        send, <kbd className="rounded bg-muted px-1.5 py-0.5">Shift+Enter</kbd>{' '}
        for new line
      </p>
    </div>
  );
}
