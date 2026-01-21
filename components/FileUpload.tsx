"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface UploadResult {
  fileName: string;
  fileUrl: string;
  fileType: string;
  csvUrl?: string;
  itemsCount?: number;
  extractedData?: any;
  success?: boolean;
  error?: string;
  errorCode?: string;
  errorDetails?: string;
}

interface FileUploadProps {
  onUploadComplete?: (data: UploadResult) => void;
  onUploadStart?: () => void;
}

interface ErrorInfo {
  message: string;
  code?: string;
  details?: string;
}

export default function FileUpload({ onUploadComplete, onUploadStart }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<ErrorInfo | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const getErrorMessage = (errorCode?: string): string => {
    switch (errorCode) {
      case 'API_KEY_MISSING':
        return 'API key is missing or invalid. Please check your configuration.';
      case 'API_ERROR':
        return 'Failed to communicate with the server. Please try again.';
      case 'FILE_UPLOAD_FAILED':
        return 'Failed to upload file for processing.';
      case 'PARSE_ERROR':
        return 'Failed to parse the extracted data. The document format may not be supported.';
      case 'UNSUPPORTED_FILE':
        return 'This file type is not supported. Please use PDF, JPEG, or PNG.';
      default:
        return 'An unexpected error occurred during extraction.';
    }
  };

  const handleFile = async (file: File) => {
    // Reset previous states
    setUploadSuccess(false);
    setUploadError(null);
    setShowErrorDetails(false);
    setUploadedFileName(null);

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError({
        message: "Invalid file type. Only JPEG, PNG, and PDF files are allowed.",
        code: "INVALID_TYPE",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError({
        message: "File size exceeds 10MB limit. Please upload a smaller file.",
        code: "FILE_TOO_LARGE",
      });
      return;
    }

    setUploading(true);
    if (onUploadStart) {
      onUploadStart();
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Upload failed. Please try again.";
        let errorCode = "HTTP_ERROR";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.errorCode || errorCode;
        } catch {
          if (response.status === 400) {
            errorMessage = "Invalid file. Please check the file and try again.";
          } else if (response.status === 413) {
            errorMessage = "File is too large. Maximum size is 10MB.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          }
        }
        throw { message: errorMessage, code: errorCode };
      }

      const data: UploadResult = await response.json();

      if (data.error || data.success === false) {
        const errorMsg = data.error || getErrorMessage(data.errorCode);
        setUploadError({
          message: errorMsg,
          code: data.errorCode,
          details: data.errorDetails,
        });
        setUploadSuccess(false);
      } else {
        setUploadSuccess(true);
        setUploadedFileName(file.name);
        setUploadError(null);

        setTimeout(() => {
          setUploadSuccess(false);
          setUploadedFileName(null);
        }, 5000);
      }

      if (onUploadComplete) {
        onUploadComplete(data);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadSuccess(false);
      setUploadedFileName(null);
      setUploadError({
        message: error.message || "Failed to upload file. Please check your connection and try again.",
        code: error.code,
        details: error.details,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300",
        uploadError
          ? "border-destructive/50 bg-destructive/5"
          : dragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : uploadSuccess
          ? "border-success/50 bg-success/5"
          : "border-border hover:border-primary/50 hover:bg-accent/50",
        uploading ? "opacity-70 pointer-events-none" : "cursor-pointer"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={handleChange}
        disabled={uploading}
      />

      {uploading ? (
        <div className="flex flex-col items-center animate-fade-in">
          <div className="relative mb-4">
            <div className="h-14 w-14 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 h-14 w-14 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-base font-medium text-foreground">Processing your file...</p>
          <p className="text-sm text-muted-foreground mt-1">Extracting data from document</p>
        </div>
      ) : uploadError ? (
        <div className="flex flex-col items-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <svg
              className="h-7 w-7 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-destructive">Extraction Failed</p>
          {uploadError.code && (
            <span className="mt-1 inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-mono text-destructive">
              {uploadError.code}
            </span>
          )}
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            {uploadError.message}
          </p>
          {uploadError.details && (
            <div className="mt-3 w-full max-w-sm">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowErrorDetails(!showErrorDetails);
                }}
                className="text-xs text-destructive hover:text-destructive/80 underline underline-offset-2"
              >
                {showErrorDetails ? "Hide technical details" : "Show technical details"}
              </button>
              {showErrorDetails && (
                <div className="mt-2 p-3 bg-destructive/5 border border-destructive/20 rounded-lg text-xs text-left font-mono text-destructive/80 max-h-32 overflow-auto scrollbar-thin">
                  {uploadError.details}
                </div>
              )}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              setUploadError(null);
              setShowErrorDetails(false);
            }}
          >
            Try again
          </Button>
        </div>
      ) : uploadSuccess ? (
        <div className="flex flex-col items-center animate-fade-in">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-4">
            <svg
              className="h-7 w-7 text-success"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <p className="text-base font-semibold text-success">Upload Successful!</p>
          <p className="text-sm text-muted-foreground mt-1">
            {uploadedFileName}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Data has been extracted and saved
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mb-4 transition-colors group-hover:bg-primary/20">
            <svg
              className="h-7 w-7 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p className="text-base font-medium text-foreground">
            Drop your file here, or{" "}
            <span className="text-primary">browse</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            PDF, PNG, or JPG up to 10MB
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Smart extraction
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Instant processing
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
