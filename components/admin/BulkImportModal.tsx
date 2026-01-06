'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  File,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseFile } from '@/lib/utils/csv-parser';
import { ImportPreviewTable } from './ImportPreviewTable';
import type {
  RowValidationResult,
  ValidationSummary,
} from '@/app/api/admin/agencies/bulk-import/preview/route';
import type { BulkImportResponse } from '@/app/api/admin/agencies/bulk-import/route';
import Link from 'next/link';

const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx'];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'results';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

function isValidFileType(file: File): boolean {
  // Check MIME type
  if (ACCEPTED_FILE_TYPES.includes(file.type)) {
    return true;
  }
  // Fallback to extension check for cases where MIME type isn't reliable
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(extension);
}

export function BulkImportModal({
  isOpen,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewRows, setPreviewRows] = useState<RowValidationResult[]>([]);
  const [previewSummary, setPreviewSummary] =
    useState<ValidationSummary | null>(null);
  const [importResults, setImportResults] = useState<BulkImportResponse | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);

    // Validate file type
    if (!isValidFileType(file)) {
      setError('Invalid file type. Please upload a .csv or .xlsx file.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setCurrentStep('upload');
    setPreviewRows([]);
    setPreviewSummary(null);
    setImportResults(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  }, [onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel]
  );

  const handleNext = useCallback(async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Parse the file
      const parseResult = await parseFile(selectedFile);

      if (!parseResult.success && parseResult.data.length === 0) {
        // Complete failure - can't proceed
        const errorMessages = parseResult.errors
          .map((e) => e.message)
          .join('; ');
        setError(errorMessages || 'Failed to parse file');
        setIsLoading(false);
        return;
      }

      // Call the preview API for validation
      const response = await fetch('/api/admin/agencies/bulk-import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parseResult.data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Server error: ${response.status}`
        );
      }

      const previewData = await response.json();
      setPreviewRows(previewData.rows);
      setPreviewSummary(previewData.summary);
      setCurrentStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleBack = useCallback(() => {
    setCurrentStep('upload');
    setPreviewRows([]);
    setPreviewSummary(null);
  }, []);

  const handleImport = useCallback(async () => {
    if (!previewSummary) return;

    setCurrentStep('importing');
    setError(null);

    try {
      // Get only valid rows for import
      const validRows = previewRows
        .filter((row) => row.valid)
        .map((row) => row.data);

      // Call the bulk import API
      const response = await fetch('/api/admin/agencies/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Server error: ${response.status}`
        );
      }

      const results: BulkImportResponse = await response.json();
      setImportResults(results);
      setCurrentStep('results');

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to import agencies'
      );
      setCurrentStep('preview'); // Go back to preview on error
    }
  }, [previewRows, previewSummary, onSuccess]);

  const renderUploadStep = () => (
    <>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          error && 'border-destructive'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-testid="drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleInputChange}
          className="hidden"
          data-testid="file-input"
        />

        {selectedFile ? (
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-3 bg-muted rounded-lg px-4 py-3">
              <File className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p
                  className="font-medium text-sm"
                  data-testid="selected-file-name"
                >
                  {selectedFile.name}
                </p>
                <p
                  className="text-xs text-muted-foreground"
                  data-testid="selected-file-size"
                >
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                className="ml-2 h-8 w-8 p-0"
                data-testid="remove-file-button"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remove file</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop your file here, or{' '}
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  data-testid="browse-button"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports CSV and XLSX files up to {MAX_FILE_SIZE_MB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          className="flex items-center gap-2 text-sm text-destructive mt-3"
          data-testid="file-error"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <DialogFooter className="gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
          data-testid="bulk-import-cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!selectedFile || isLoading}
          data-testid="next-button"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Next'
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const renderPreviewStep = () => {
    if (!previewSummary) {
      return (
        <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    return (
      <ImportPreviewTable
        rows={previewRows}
        summary={previewSummary}
        onBack={handleBack}
        onImport={handleImport}
      />
    );
  };

  const renderImportingStep = () => (
    <div className="py-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="rounded-full bg-primary/10 p-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Importing Agencies...</h3>
          <p className="text-sm text-muted-foreground">
            Importing {previewSummary?.valid || 0} of{' '}
            {previewSummary?.total || 0} agencies
          </p>
        </div>
        <Progress value={100} className="w-full max-w-md" />
      </div>
    </div>
  );

  const handleImportMore = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setCurrentStep('upload');
    setPreviewRows([]);
    setPreviewSummary(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  const renderResultsStep = () => {
    if (!importResults) {
      return (
        <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }

    const { summary, results } = importResults;
    const skippedRows = results.filter((r) => r.status === 'skipped');
    const failedRows = results.filter((r) => r.status === 'failed');

    return (
      <div className="space-y-6" data-testid="import-results">
        {/* Success Summary */}
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900">Import Complete</h3>
            <p className="text-sm text-green-700 mt-1">
              Created: {summary.created}, Skipped: {summary.skipped}, Failed:{' '}
              {summary.failed}
            </p>
          </div>
        </div>

        {/* Skipped Agencies */}
        {skippedRows.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Skipped Agencies ({skippedRows.length})
            </h4>
            <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
              {skippedRows.map((row) => (
                <div
                  key={row.rowNumber}
                  className="p-3 text-sm"
                  data-testid={`skipped-row-${row.rowNumber}`}
                >
                  <div className="font-medium">{row.agencyName}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {row.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Agencies */}
        {failedRows.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              Failed Agencies ({failedRows.length})
            </h4>
            <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
              {failedRows.map((row) => (
                <div
                  key={row.rowNumber}
                  className="p-3 text-sm"
                  data-testid={`failed-row-${row.rowNumber}`}
                >
                  <div className="font-medium">{row.agencyName}</div>
                  <div className="text-destructive text-xs mt-1">
                    {row.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            data-testid="close-button"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleImportMore}
            data-testid="import-more-button"
          >
            Import More
          </Button>
          <Button type="button" asChild>
            <Link href="/admin/agencies" data-testid="view-agencies-button">
              View Agencies
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </DialogFooter>
      </div>
    );
  };

  const getDialogDescription = () => {
    switch (currentStep) {
      case 'upload':
        return 'Upload a CSV or XLSX file containing agency data to import multiple agencies at once.';
      case 'preview':
        return 'Review the agencies to be imported.';
      case 'importing':
        return 'Please wait while we import your agencies.';
      case 'results':
        return 'Import complete. Review the results below.';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          currentStep === 'preview' || currentStep === 'results'
            ? 'max-w-4xl'
            : 'max-w-xl'
        )}
        data-testid="bulk-import-modal"
      >
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            Bulk Import Agencies
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'importing' && renderImportingStep()}
        {currentStep === 'results' && renderResultsStep()}
      </DialogContent>
    </Dialog>
  );
}
