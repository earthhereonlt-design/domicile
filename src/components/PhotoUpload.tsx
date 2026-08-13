import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  value: string; // base64 representation of image
  onChange: (base64: string) => void;
  label?: string;
  description?: string;
  error?: string;
}

export default function PhotoUpload({
  value,
  onChange,
  label = "Upload Photo",
  description = "PNG, JPG, or WEBP. Max size 2MB.",
  error,
}: PhotoUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setLocalError(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setLocalError('Invalid file type. Please upload a JPEG, PNG, or WEBP image.');
      return;
    }

    // Validate size (2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setLocalError('File is too large. Maximum size allowed is 2MB.');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        onChange(e.target.result);
      }
    };
    reader.onerror = () => {
      setLocalError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayError = error || localError;

  return (
    <div className="w-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
        {label}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {!value ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={cn(
            "w-full flex flex-col items-center justify-center border-2 border-dashed border-border-color rounded-xl p-8 cursor-pointer bg-white dark:bg-stone-900 transition-border duration-200 hover:border-foreground/30 text-center",
            isDragActive && "border-accent bg-accent/5",
            displayError && "border-red-500 hover:border-red-500/80"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4 text-muted-text">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-foreground/70"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Drag and drop your file here, or <span className="text-accent hover:underline">browse</span>
          </p>
          <p className="text-xs text-muted-text">{description}</p>
        </div>
      ) : (
        <div className="relative w-full border border-border-color rounded-xl p-4 bg-white dark:bg-stone-900 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border-color bg-stone-100 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-foreground mb-1">Image uploaded successfully</p>
            <p className="text-xs text-muted-text mb-4">Click below to change or remove this photo.</p>
            
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={triggerFileInput}
                className="px-3 py-1.5 border border-border-color text-xs font-semibold rounded-md bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 text-foreground transition-colors"
              >
                Replace Photo
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 border border-red-200 text-xs font-semibold rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {displayError && <p className="mt-2 text-xs text-red-500">{displayError}</p>}
    </div>
  );
}
