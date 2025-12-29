'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const handleNext = useCallback(() => {
    if (selectedFile) {
      // For now, just move to preview step
      // Future tasks will implement the actual preview functionality
      setCurrentStep('preview');
    }
  }, [selectedFile]);

  const handleBack = useCallback(() => {
    setCurrentStep('upload');
  }, []);

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
          data-testid="cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={!selectedFile}
          data-testid="next-button"
        >
          Next
        </Button>
      </DialogFooter>
    </>
  );

  const renderPreviewStep = () => (
    <>
      <div className="min-h-[200px] flex items-center justify-center text-muted-foreground">
        <p>Preview step will be implemented in Task 2.2.2</p>
      </div>

      <DialogFooter className="gap-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          data-testid="back-button"
        >
          Back
        </Button>
        <Button type="button" disabled data-testid="import-button">
          Import
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl" data-testid="bulk-import-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            Bulk Import Agencies
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'upload'
              ? 'Upload a CSV or XLSX file containing agency data to import multiple agencies at once.'
              : 'Review the agencies to be imported.'}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'preview' && renderPreviewStep()}
      </DialogContent>
    </Dialog>
  );
}
