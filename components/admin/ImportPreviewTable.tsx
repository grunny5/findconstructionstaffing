'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  RowValidationResult,
  ValidationSummary,
} from '@/app/api/admin/agencies/bulk-import/preview/route';

export interface ImportPreviewTableProps {
  rows: RowValidationResult[];
  summary: ValidationSummary;
  onBack: () => void;
  onImport: () => void;
  isImporting?: boolean;
}

type RowStatus = 'valid' | 'invalid' | 'warning';

function getRowStatus(row: RowValidationResult): RowStatus {
  if (!row.valid) return 'invalid';
  if (row.warnings.length > 0) return 'warning';
  return 'valid';
}

function StatusIcon({ status }: { status: RowStatus }) {
  switch (status) {
    case 'valid':
      return (
        <Check
          className="h-4 w-4 text-green-600"
          data-testid="status-icon-valid"
        />
      );
    case 'invalid':
      return (
        <X className="h-4 w-4 text-red-600" data-testid="status-icon-invalid" />
      );
    case 'warning':
      return (
        <AlertTriangle
          className="h-4 w-4 text-yellow-600"
          data-testid="status-icon-warning"
        />
      );
  }
}

function RowDetails({
  row,
  isExpanded,
  onToggle,
}: {
  row: RowValidationResult;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const status = getRowStatus(row);
  const hasDetails = row.errors.length > 0 || row.warnings.length > 0;

  return (
    <>
      <TableRow
        className={cn(
          'cursor-pointer hover:bg-muted/50',
          status === 'invalid' && 'bg-red-50/50',
          status === 'warning' && 'bg-yellow-50/50'
        )}
        onClick={hasDetails ? onToggle : undefined}
        data-testid={`preview-row-${row.rowNumber}`}
      >
        <TableCell className="w-12">
          {hasDetails ? (
            <button
              type="button"
              className="p-1 hover:bg-muted rounded"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              data-testid={`expand-button-${row.rowNumber}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-6 inline-block" />
          )}
        </TableCell>
        <TableCell className="w-16 text-center text-muted-foreground text-sm">
          {row.rowNumber}
        </TableCell>
        <TableCell className="w-16">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <StatusIcon status={status} />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {status === 'valid' && 'Valid - ready to import'}
                {status === 'invalid' &&
                  `Invalid - ${row.errors.length} error(s)`}
                {status === 'warning' &&
                  `Valid with ${row.warnings.length} warning(s)`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell className="font-medium">{row.data.name || '—'}</TableCell>
        <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
          {row.data.description || '—'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {row.data.email || '—'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {row.data.headquarters || '—'}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {row.data.trades?.join(', ') || '—'}
        </TableCell>
      </TableRow>
      {isExpanded && hasDetails && (
        <TableRow data-testid={`details-row-${row.rowNumber}`}>
          <TableCell colSpan={8} className="bg-muted/30 py-3">
            <div className="pl-12 space-y-2">
              {row.errors.length > 0 && (
                <div data-testid={`errors-${row.rowNumber}`}>
                  <p className="text-sm font-medium text-red-600 mb-1">
                    Errors:
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                    {row.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {row.warnings.length > 0 && (
                <div data-testid={`warnings-${row.rowNumber}`}>
                  <p className="text-sm font-medium text-yellow-600 mb-1">
                    Warnings:
                  </p>
                  <ul className="list-disc list-inside text-sm text-yellow-600 space-y-1">
                    {row.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function ImportPreviewTable({
  rows,
  summary,
  onBack,
  onImport,
  isImporting = false,
}: ImportPreviewTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (rowNumber: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) {
        next.delete(rowNumber);
      } else {
        next.add(rowNumber);
      }
      return next;
    });
  };

  const hasValidRows = summary.valid > 0;

  // Memoize row rendering for performance with large datasets
  const rowElements = useMemo(
    () =>
      rows.map((row) => (
        <RowDetails
          key={row.rowNumber}
          row={row}
          isExpanded={expandedRows.has(row.rowNumber)}
          onToggle={() => toggleRow(row.rowNumber)}
        />
      )),
    [rows, expandedRows]
  );

  return (
    <div className="flex flex-col h-full" data-testid="import-preview-table">
      {/* Summary Bar */}
      <div
        className="flex items-center justify-between bg-muted/50 px-4 py-3 rounded-lg mb-4"
        data-testid="summary-bar"
      >
        <div className="flex items-center gap-6 text-sm">
          <span data-testid="summary-total">
            <span className="font-medium">{summary.total}</span> total rows
          </span>
          <span
            className="flex items-center gap-1.5"
            data-testid="summary-valid"
          >
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">
              {summary.valid}
            </span>{' '}
            valid
          </span>
          <span
            className="flex items-center gap-1.5"
            data-testid="summary-invalid"
          >
            <X className="h-4 w-4 text-red-600" />
            <span className="font-medium text-red-600">
              {summary.invalid}
            </span>{' '}
            invalid
          </span>
          <span
            className="flex items-center gap-1.5"
            data-testid="summary-warnings"
          >
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-yellow-600">
              {summary.withWarnings}
            </span>{' '}
            with warnings
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg flex-1 min-h-0">
        <ScrollArea className="h-[350px]" data-testid="table-scroll-area">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead className="w-16 text-center">Row</TableHead>
                <TableHead className="w-16">Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Headquarters</TableHead>
                <TableHead>Trades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <span className="text-muted-foreground">
                      No rows to preview
                    </span>
                  </TableCell>
                </TableRow>
              ) : (
                rowElements
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isImporting}
          data-testid="back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          type="button"
          onClick={onImport}
          disabled={!hasValidRows || isImporting}
          data-testid="import-button"
        >
          {isImporting ? (
            <>Importing...</>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import {summary.valid} Valid{' '}
              {summary.valid === 1 ? 'Row' : 'Rows'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
