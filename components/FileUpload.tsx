"use client";

import { useState, useRef } from "react";

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
        return 'Gemini API key is missing or invalid. Please check your configuration.';
      case 'API_ERROR':
        return 'Failed to communicate with Gemini API. Please try again.';
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
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
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
        // Try to get error message from response
        let errorMessage = "Upload failed. Please try again.";
        let errorCode = "HTTP_ERROR";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.errorCode || errorCode;
        } catch {
          // If response is not JSON, use status-based message
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

      // Check if there's an error in the response (extraction failed)
      if (data.error || data.success === false) {
        const errorMsg = data.error || getErrorMessage(data.errorCode);
        setUploadError({
          message: errorMsg,
          code: data.errorCode,
          details: data.errorDetails,
        });
        setUploadSuccess(false);
      } else {
        // Show success message
        setUploadSuccess(true);
        setUploadedFileName(file.name);
        setUploadError(null);

        // Reset success message after 5 seconds
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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        uploadError
          ? "border-red-500 bg-red-50"
          : dragActive
          ? "border-blue-500 bg-blue-50"
          : uploadSuccess
          ? "border-green-500 bg-green-50"
          : "border-gray-300 hover:border-gray-400"
      } ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
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
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-600">Uploading...</p>
        </div>
      ) : uploadError ? (
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-red-100 p-3 mb-2">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-red-600 font-semibold">Extraction Failed</p>
          {uploadError.code && (
            <p className="text-xs text-red-400 mt-1 font-mono">
              Error Code: {uploadError.code}
            </p>
          )}
          <p className="text-sm text-red-600 mt-1 text-center max-w-md">
            {uploadError.message}
          </p>
          {uploadError.details && (
            <div className="mt-2 w-full max-w-md">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowErrorDetails(!showErrorDetails);
                }}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                {showErrorDetails ? "Hide Details" : "Show Details"}
              </button>
              {showErrorDetails && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-left font-mono text-red-700 max-h-32 overflow-auto">
                  {uploadError.details}
                </div>
              )}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUploadError(null);
              setShowErrorDetails(false);
            }}
            className="mt-3 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss & Try Again
          </button>
        </div>
      ) : uploadSuccess ? (
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-green-100 p-3 mb-2">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-green-600 font-semibold">Upload Successful!</p>
          <p className="text-sm text-gray-600 mt-1">
            {uploadedFileName}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PNG, JPG, PDF up to 10MB
          </p>
        </div>
      )}
    </div>
  );
}
