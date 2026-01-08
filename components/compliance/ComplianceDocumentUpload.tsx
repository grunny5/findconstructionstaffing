'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  X,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplianceType } from '@/types/api';

const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpeg', '.jpg'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface ComplianceDocumentUploadProps {
  complianceType: ComplianceType;
  currentUrl?: string | null;
  onUpload: (file: File) => void | Promise<void>;
  onRemove: () => void | Promise<void>;
  isUploading?: boolean;
  disabled?: boolean;
  error?: string | null;
}

function isValidFileType(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) {
    return true;
  }
  const lastSegment = file.name.split('.').pop();
  if (!lastSegment || lastSegment === '') {
    return false;
  }
  const extension = '.' + lastSegment.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(extension);
}

function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export function ComplianceDocumentUpload({
  complianceType,
  currentUrl,
  onUpload,
  onRemove,
  isUploading = false,
  disabled = false,
  error: externalError,
}: ComplianceDocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = externalError || validationError;
  // Strip query parameters from signed URLs before checking extension
  const urlWithoutQuery = currentUrl?.split('?')[0];
  const isPdf = selectedFile
    ? isPdfFile(selectedFile)
    : urlWithoutQuery?.toLowerCase().endsWith('.pdf');

  const handleFileSelect = useCallback(
    (file: File) => {
      setValidationError(null);

      if (!isValidFileType(file)) {
        setValidationError(
          'Invalid file type. Please upload a PDF, PNG, or JPEG file.'
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(
          `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`
        );
        return;
      }

      setSelectedFile(file);

      if (!isPdfFile(file)) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      void onUpload(file);
    },
    [onUpload]
  );

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

      if (disabled || isUploading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect, disabled, isUploading]
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
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  }, [disabled, isUploading]);

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    void onRemove();
  }, [previewUrl, onRemove]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled || isUploading) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleBrowseClick();
      }
    },
    [disabled, isUploading, handleBrowseClick]
  );

  const displayUrl = previewUrl || currentUrl;
  const hasDocument = !!displayUrl || !!selectedFile;
  const isInteractive = !hasDocument && !disabled && !isUploading;

  return (
    <div
      className="space-y-3"
      data-testid={`document-upload-${complianceType}`}
    >
      <div className="text-sm font-medium">Supporting Documentation</div>

      <div
        className={cn(
          'relative w-full max-w-md h-[200px] rounded-lg border-2 border-dashed transition-colors',
          isDragging && 'border-primary bg-primary/5',
          hasDocument && 'border-solid',
          error && 'border-destructive',
          !hasDocument && !isDragging && !error && 'border-muted-foreground/25',
          disabled || isUploading
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!hasDocument ? handleBrowseClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : -1}
        aria-disabled={disabled || isUploading}
        data-testid="document-upload-zone"
      >
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              data-testid="document-upload-spinner"
            />
          </div>
        )}

        {hasDocument ? (
          <div className="relative w-full h-full p-4">
            {isPdf ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="p-4 bg-muted rounded-full">
                  <FileText className="h-12 w-12 text-primary" />
                </div>
                <div className="text-center">
                  <p
                    className="text-sm font-medium"
                    data-testid="document-filename"
                  >
                    {selectedFile?.name || 'Document.pdf'}
                  </p>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  )}
                </div>
                {currentUrl && !isUploading && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(currentUrl, '_blank');
                    }}
                    data-testid="view-document-button"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                )}
              </div>
            ) : displayUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Use native img for blob URLs - next/Image doesn't support blob: protocol */}
                <img
                  src={displayUrl}
                  alt="Document preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  data-testid="document-preview-image"
                />
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-full"
                data-testid="document-preview-image"
              >
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
            {!isUploading && !disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                data-testid="document-remove-button"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="p-3 bg-muted rounded-full mb-3">
              {isDragging ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm font-medium mb-1">
              {isDragging ? 'Drop document here' : 'Drag and drop a document'}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, PNG, or JPEG (max {MAX_FILE_SIZE_MB}MB)
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        data-testid="document-file-input"
      />

      {error && (
        <div
          className="flex items-center gap-2 text-sm text-destructive"
          data-testid="document-error-message"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && !error && (
        <div
          className="text-xs text-muted-foreground"
          data-testid="document-file-info"
        >
          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
        </div>
      )}
    </div>
  );
}
