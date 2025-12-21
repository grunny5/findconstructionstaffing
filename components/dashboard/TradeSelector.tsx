'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Star } from 'lucide-react';
import { TradeSelectionModal } from './TradeSelectionModal';
import type { Trade } from '@/types/supabase';
import { cn } from '@/lib/utils';

const FEATURED_COUNT = 3;

interface TradeSelectorProps {
  selectedTrades: Trade[];
  onChange: (trades: Trade[]) => void;
  disabled?: boolean;
  maxTrades?: number;
}

/**
 * Trade selection component for agency profile management
 *
 * Features:
 * - Display selected trades as chips/badges
 * - "Add Trades" button to open selection modal
 * - Visual indicator for top 3 featured trades
 * - Remove individual trades via X button
 * - Modal with searchable trade list and drag-and-drop reordering
 *
 * @param selectedTrades - Currently selected trades
 * @param onChange - Callback when trades are updated
 * @param disabled - Disable all interactions
 * @param maxTrades - Maximum number of trades allowed (default: 10)
 */
export function TradeSelector({
  selectedTrades,
  onChange,
  disabled = false,
  maxTrades = 10,
}: TradeSelectorProps) {
  const [showModal, setShowModal] = useState(false);

  const handleRemoveTrade = (tradeId: string) => {
    if (disabled) return;
    const updatedTrades = selectedTrades.filter((t) => t.id !== tradeId);
    onChange(updatedTrades);
  };

  const handleSave = (trades: Trade[]) => {
    onChange(trades);
  };

  const isAtMaxTrades = selectedTrades.length >= maxTrades;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">
            Trade Specializations{' '}
            <span className="text-muted-foreground">
              ({selectedTrades.length}/{maxTrades})
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select the construction trades your agency specializes in. Top{' '}
            {FEATURED_COUNT} will be featured on your profile.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Trades
        </Button>
      </div>

      {/* Selected Trades Display */}
      {selectedTrades.length === 0 ? (
        <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-md bg-muted/30">
          <p className="text-sm text-muted-foreground">
            No trades selected. Click &ldquo;Add Trades&rdquo; to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectedTrades.map((trade, index) => {
            const isFeatured = index < FEATURED_COUNT;

            return (
              <Badge
                key={trade.id}
                variant={isFeatured ? 'default' : 'secondary'}
                className={cn(
                  'gap-2 pr-1 pl-3 py-1.5',
                  isFeatured && 'bg-primary text-primary-foreground'
                )}
              >
                {isFeatured && (
                  <Star className="h-3 w-3 fill-current" aria-label="Featured" />
                )}
                <span>{trade.name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTrade(trade.id)}
                    className={cn(
                      'rounded-full p-0.5 hover:bg-background/20 transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                    )}
                    aria-label={`Remove ${trade.name}`}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Helper Text */}
      {isAtMaxTrades && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxTrades} trades reached. Remove a trade to add another.
        </p>
      )}
      {selectedTrades.length > 0 && selectedTrades.length < FEATURED_COUNT && (
        <p className="text-xs text-muted-foreground">
          Add {FEATURED_COUNT - selectedTrades.length} more trade(s) to maximize featured trades on your profile.
        </p>
      )}

      {/* Selection Modal */}
      <TradeSelectionModal
        open={showModal}
        onOpenChange={setShowModal}
        selectedTrades={selectedTrades}
        onSave={handleSave}
      />
    </div>
  );
}
