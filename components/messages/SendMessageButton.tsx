/**
 * SendMessageButton Component
 *
 * Button that allows authenticated users to send a message to a claimed agency.
 *
 * Features:
 * - Only shows for claimed agencies
 * - Checks authentication (redirects to login if needed)
 * - Checks for existing conversation before creating new
 * - Shows modal for composing initial message
 * - Creates conversation and navigates to thread
 */

'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  fetchWithTimeout,
  TIMEOUT_CONFIG,
  TimeoutError,
} from '@/lib/fetch/timeout';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 10000;

export interface SendMessageButtonProps {
  agencyId: string;
  agencyName: string;
  agencySlug: string;
  isClaimed: boolean;
}

export function SendMessageButton({
  agencyId,
  agencyName,
  agencySlug,
  isClaimed,
}: SendMessageButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isEmpty = content.trim().length === 0;
  const canSend = !isEmpty && !isOverLimit && !isSending;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const computedLineHeight = getComputedStyle(textarea).lineHeight;
    const lineHeight = parseFloat(computedLineHeight);
    const effectiveLineHeight = Number.isNaN(lineHeight) ? 20 : lineHeight;
    const maxRows = 5;
    const maxHeight = effectiveLineHeight * maxRows;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [content]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  // Don't render if agency is not claimed
  if (!isClaimed) {
    return null;
  }

  const handleButtonClick = async () => {
    // 1. Check authentication
    if (!user) {
      router.push(`/login?redirectTo=/recruiters/${agencySlug}`);
      return;
    }

    // 2. Check if conversation already exists
    try {
      const response = await fetchWithTimeout(`/api/messages/conversations`, {
        timeout: TIMEOUT_CONFIG.CLIENT_ACTION,
      });

      if (response.ok) {
        const data = await response.json();

        // Check if there's an existing conversation with this agency context
        const existingConversation = data.data.find(
          (conv: any) =>
            conv.context_type === 'agency_inquiry' &&
            conv.context_id === agencyId
        );

        if (existingConversation) {
          // Navigate to existing conversation
          router.push(`/messages/conversations/${existingConversation.id}`);
          return;
        }
      }
    } catch (error) {
      if (error instanceof TimeoutError) {
        console.warn('Conversation check timed out, showing compose modal anyway');
      } else {
        console.error('Error checking for existing conversation:', error);
      }
      // Continue to show modal even if check fails (graceful degradation)
    }

    // 3. No existing conversation - show modal
    setIsOpen(true);
  };

  const handleSendMessage = async () => {
    if (!canSend) return;

    setIsSending(true);
    setError(null);

    try {
      // Create conversation with initial message
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_type: 'agency_inquiry',
          context_id: agencyId,
          initial_message: content.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Navigate to new conversation
        router.push(`/messages/conversations/${data.data.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter = newline (default behavior)
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      setContent('');
      setError(null);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={handleButtonClick}
        className="min-w-[200px]"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Send Message
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send a message to {agencyName}</DialogTitle>
            <DialogDescription>
              Compose your inquiry below. The agency owner will be notified via
              email.
            </DialogDescription>
          </DialogHeader>

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
          <div className="flex flex-col gap-2">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${agencyName} about their staffing services...`}
              disabled={isSending}
              className={cn(
                'min-h-[120px] resize-none',
                isOverLimit &&
                  'border-destructive focus-visible:ring-destructive'
              )}
              aria-label="Message input"
              aria-describedby="char-counter"
            />

            {/* Character Counter */}
            <div
              id="char-counter"
              className={cn(
                'text-right text-xs',
                isOverLimit ? 'text-destructive' : 'text-muted-foreground'
              )}
              aria-live="polite"
            >
              {charCount} / {MAX_LENGTH.toLocaleString()}
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={!canSend}
              className="w-full"
              aria-label="Send message"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>

            {/* Keyboard Hint */}
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="rounded bg-muted px-1.5 py-0.5">Enter</kbd>{' '}
              to send,{' '}
              <kbd className="rounded bg-muted px-1.5 py-0.5">Shift+Enter</kbd>{' '}
              for new line
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
