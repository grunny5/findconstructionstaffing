'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Helper function to check if user is currently typing in an input field
 * Prevents keyboard shortcuts from triggering while typing
 */
function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement?.getAttribute('contenteditable') === 'true'
  );
}

/**
 * KeyboardShortcuts Component - Accessibility Excellence
 *
 * Global keyboard shortcuts for improved navigation and accessibility.
 * Follows WCAG 2.1 AA guidelines for keyboard navigation.
 *
 * Shortcuts:
 * - `/` - Focus search input
 * - `Esc` - Clear focus / close modals
 * - `?` - Show keyboard shortcuts help
 *
 * Features:
 * - Only triggers when not typing in input fields
 * - Prevents default browser behavior
 * - Screen reader accessible
 *
 * @example
 * ```tsx
 * // In root layout
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <KeyboardShortcuts />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // / - Focus search input
      if (e.key === '/' && !isInputFocused()) {
        e.preventDefault();
        // Try to find search input by ID or role
        const searchInput =
          document.getElementById('search-input') ||
          document.querySelector('[role="searchbox"]') ||
          document.querySelector('input[type="search"]');

        if (searchInput) {
          (searchInput as HTMLElement).focus();
        }
      }

      // Escape - Clear focus
      if (e.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement;
        // Only blur if not in a dialog (dialogs handle Escape themselves)
        if (activeElement && !activeElement.closest('[role="dialog"]')) {
          activeElement.blur();
        }
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' && !isInputFocused()) {
        e.preventDefault();
        setShowHelp(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate faster with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Shortcuts */}
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide text-industrial-graphite-600 mb-3">
              Search
            </h3>
            <div className="space-y-2">
              <ShortcutRow
                keys={['/']}
                description="Focus search input"
              />
            </div>
          </div>

          {/* Navigation Shortcuts */}
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide text-industrial-graphite-600 mb-3">
              Navigation
            </h3>
            <div className="space-y-2">
              <ShortcutRow
                keys={['Esc']}
                description="Clear focus / Close modals"
              />
              <ShortcutRow
                keys={['Tab']}
                description="Move to next interactive element"
              />
              <ShortcutRow
                keys={['Shift', 'Tab']}
                description="Move to previous interactive element"
              />
            </div>
          </div>

          {/* General Shortcuts */}
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide text-industrial-graphite-600 mb-3">
              General
            </h3>
            <div className="space-y-2">
              <ShortcutRow
                keys={['?']}
                description="Show this help dialog"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * ShortcutRow Component
 * Displays a keyboard shortcut with its description
 */
interface ShortcutRowProps {
  keys: string[];
  description: string;
}

function ShortcutRow({ keys, description }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-industrial-graphite-200">
      <span className="font-body text-sm text-industrial-graphite-600">
        {description}
      </span>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 font-body text-xs font-semibold text-industrial-graphite-600 bg-industrial-graphite-100 border-2 border-industrial-graphite-300 rounded-industrial-sharp">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="mx-1 text-industrial-graphite-400">+</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
