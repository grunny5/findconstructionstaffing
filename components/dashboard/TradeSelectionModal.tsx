'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GripVertical, X, Star, Loader2, AlertTriangle } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabase';
import type { Trade } from '@/types/supabase';
import { cn } from '@/lib/utils';

const MAX_TRADES = 10;
const FEATURED_COUNT = 3;

interface SelectedTrade extends Trade {
  isFeatured?: boolean;
}

interface TradeSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTrades: Trade[];
  onSave: (trades: Trade[]) => void;
}

interface SortableTradeItemProps {
  trade: SelectedTrade;
  onRemove: (tradeId: string) => void;
}

function SortableTradeItem({ trade, onRemove }: SortableTradeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: trade.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 border rounded-md bg-background',
        trade.isFeatured && 'border-primary bg-primary/5'
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${trade.name}`}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-sm">{trade.name}</span>
        {trade.isFeatured && (
          <Badge variant="secondary" className="text-xs gap-1">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </Badge>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onRemove(trade.id)}
        aria-label={`Remove ${trade.name}`}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function TradeSelectionModal({
  open,
  onOpenChange,
  selectedTrades: initialSelectedTrades,
  onSave,
}: TradeSelectionModalProps) {
  const [availableTrades, setAvailableTrades] = useState<Trade[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<SelectedTrade[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load available trades from database
  useEffect(() => {
    if (!open) return;

    async function loadTrades() {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('trades')
          .select('id, name, slug, description')
          .order('name');

        if (fetchError) throw fetchError;

        setAvailableTrades(data || []);
      } catch (err) {
        console.error('Error loading trades:', err);
        setError('Failed to load trades. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadTrades();
  }, [open]);

  // Initialize selected trades when modal opens
  useEffect(() => {
    if (open) {
      const tradesWithFeatured = initialSelectedTrades.map((trade, index) => ({
        ...trade,
        isFeatured: index < FEATURED_COUNT,
      }));
      setSelectedTrades(tradesWithFeatured);
    }
  }, [open, initialSelectedTrades]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedTrades((trades) => {
        const oldIndex = trades.findIndex((t) => t.id === active.id);
        const newIndex = trades.findIndex((t) => t.id === over.id);
        const reordered = arrayMove(trades, oldIndex, newIndex);

        // Update featured status based on position
        return reordered.map((trade, index) => ({
          ...trade,
          isFeatured: index < FEATURED_COUNT,
        }));
      });
    }
  };

  const handleToggleTrade = (trade: Trade) => {
    const isSelected = selectedTrades.some((t) => t.id === trade.id);

    if (isSelected) {
      setSelectedTrades((trades) => {
        const filtered = trades.filter((t) => t.id !== trade.id);
        // Update featured status after removal
        return filtered.map((t, index) => ({
          ...t,
          isFeatured: index < FEATURED_COUNT,
        }));
      });
    } else {
      if (selectedTrades.length >= MAX_TRADES) {
        // Don't add - show warning (already shown in UI)
        return;
      }
      setSelectedTrades((trades) => {
        const newTrades = [...trades, { ...trade, isFeatured: false }];
        // Update featured status
        return newTrades.map((t, index) => ({
          ...t,
          isFeatured: index < FEATURED_COUNT,
        }));
      });
    }
  };

  const handleRemoveTrade = (tradeId: string) => {
    setSelectedTrades((trades) => {
      const filtered = trades.filter((t) => t.id !== tradeId);
      // Update featured status after removal
      return filtered.map((t, index) => ({
        ...t,
        isFeatured: index < FEATURED_COUNT,
      }));
    });
  };

  const handleSave = () => {
    // Remove isFeatured property before saving (not part of Trade type)
    const tradesToSave = selectedTrades.map(
      ({ isFeatured, ...trade }) => trade
    );
    onSave(tradesToSave);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to initial state
    const tradesWithFeatured = initialSelectedTrades.map((trade, index) => ({
      ...trade,
      isFeatured: index < FEATURED_COUNT,
    }));
    setSelectedTrades(tradesWithFeatured);
    setSearchQuery('');
    onOpenChange(false);
  };

  const filteredTrades = availableTrades.filter((trade) =>
    trade.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAtMaxTrades = selectedTrades.length >= MAX_TRADES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Select Trade Specializations</DialogTitle>
          <DialogDescription>
            Choose up to {MAX_TRADES} trades. Drag to reorder - top{' '}
            {FEATURED_COUNT} will be featured on your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 h-full overflow-y-auto">
            {/* Available Trades */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Available Trades</h3>
                <p className="text-sm text-muted-foreground">
                  Search and select trades
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Command className="border rounded-md">
                <CommandInput
                  placeholder="Search trades..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList className="max-h-[400px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty>No trades found.</CommandEmpty>
                      <CommandGroup>
                        {filteredTrades.map((trade) => {
                          const isSelected = selectedTrades.some(
                            (t) => t.id === trade.id
                          );
                          const isDisabled = !isSelected && isAtMaxTrades;

                          return (
                            <CommandItem
                              key={trade.id}
                              value={trade.name}
                              onSelect={() => handleToggleTrade(trade)}
                              disabled={isDisabled}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={isSelected}
                                disabled={isDisabled}
                                aria-label={`Select ${trade.name}`}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{trade.name}</div>
                                {trade.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {trade.description}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </div>

            {/* Selected Trades */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">
                  Selected Trades ({selectedTrades.length}/{MAX_TRADES})
                </h3>
                <p className="text-sm text-muted-foreground">
                  Drag to reorder. Top {FEATURED_COUNT} are featured.
                </p>
              </div>

              {isAtMaxTrades && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maximum {MAX_TRADES} trades allowed. Remove one to add
                    another.
                  </AlertDescription>
                </Alert>
              )}

              {selectedTrades.length === 0 ? (
                <div className="flex items-center justify-center h-[200px] border-2 border-dashed rounded-md">
                  <p className="text-sm text-muted-foreground">
                    No trades selected
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedTrades.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedTrades.map((trade) => (
                        <SortableTradeItem
                          key={trade.id}
                          trade={trade}
                          onRemove={handleRemoveTrade}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
