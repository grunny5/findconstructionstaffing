'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle, Loader2, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  isUploading?: boolean;
  disabled?: boolean;
  error?: string | null;
}

function isValidFileType(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) {
    return true;
  }
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(extension);
}

export function LogoUpload({
  currentLogoUrl,
  onFileSelect,
  isUploading = false,
  disabled = false,
  error: externalError,
}: LogoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = externalError || validationError;

  const handleFileSelect = useCallback(
    (file: File) => {
      setValidationError(null);

      if (!isValidFileType(file)) {
        setValidationError(
          'Invalid file type. Please upload a PNG, JPG, or WebP image.'
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
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onFileSelect(file);
    },
    [onFileSelect]
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
    onFileSelect(null);
  }, [previewUrl, onFileSelect]);

  // Cleanup object URL on unmount or when previewUrl changes
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

  const displayUrl = previewUrl || currentLogoUrl;
  const hasImage = !!displayUrl;
  const isInteractive = !hasImage && !disabled && !isUploading;

  return (
    <div className="space-y-3" data-testid="logo-upload">
      <div className="text-sm font-medium">Agency Logo</div>

      {/* Preview / Upload Zone */}
      <div
        className={cn(
          'relative w-[300px] h-[300px] rounded-lg border-2 border-dashed transition-colors',
          isDragging && 'border-primary bg-primary/5',
          hasImage && 'border-solid',
          error && 'border-destructive',
          !hasImage && !isDragging && !error && 'border-muted-foreground/25',
          disabled || isUploading
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!hasImage ? handleBrowseClick : undefined}
        onKeyDown={isInteractive ? handleKeyDown : undefined}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : -1}
        aria-disabled={disabled || isUploading}
        data-testid="logo-upload-zone"
      >
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              data-testid="logo-upload-spinner"
            />
          </div>
        )}

        {hasImage ? (
          <div className="relative w-full h-full">
            <Image
              src={displayUrl}
              alt="Agency logo preview"
              fill
              className="object-cover rounded-lg"
              data-testid="logo-preview-image"
            />
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
                data-testid="logo-remove-button"
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
              {isDragging ? 'Drop image here' : 'Drag and drop an image'}
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, or WebP (max {MAX_FILE_SIZE_MB}MB)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Recommended: Square image, 300x300px
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        data-testid="logo-file-input"
      />

      {/* Error message */}
      {error && (
        <div
          className="flex items-center gap-2 text-sm text-destructive"
          data-testid="logo-error-message"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* File info when selected */}
      {selectedFile && !error && (
        <div
          className="text-xs text-muted-foreground"
          data-testid="logo-file-info"
        >
          Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{' '}
          KB)
        </div>
      )}
    </div>
  );
}
