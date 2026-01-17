"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";

interface UploadResult {
  fileName: string;
  fileUrl: string;
  fileType: string;
  csvUrl?: string;
  itemsCount?: number;
  extractedData?: any;
  error?: string;
}

export default function UploadPage() {
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadComplete = async (data: UploadResult) => {
    setUploadResult(data);
    setIsUploading(false);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadResult(null);
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Files</h1>
        <p className="text-gray-600">
          Upload packing list images or PDFs to extract inventory data to CSV
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload File</h2>
        <FileUpload
          onUploadComplete={handleUploadComplete}
          onUploadStart={handleUploadStart}
        />
      </div>

      {isUploading && (
        <div className="bg-blue-50 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p className="font-medium text-blue-800">Processing file with Gemini AI...</p>
              <p className="text-sm text-blue-600">Extracting data from your document</p>
            </div>
          </div>
        </div>
      )}

      {uploadResult && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Extraction Results</h2>
            {uploadResult.error ? (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                Error
              </span>
            ) : uploadResult.csvUrl ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Success
              </span>
            ) : (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                No Data
              </span>
            )}
          </div>

          {/* Error Display */}
          {uploadResult.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Extraction Failed</p>
              <p className="text-red-700 text-sm mt-1">{uploadResult.error}</p>
            </div>
          )}

          {/* File Info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">File Name:</span>
                <p className="font-medium">{uploadResult.fileName}</p>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-medium">{uploadResult.fileType}</p>
              </div>
              <div>
                <span className="text-gray-500">Items Extracted:</span>
                <p className="font-medium">{uploadResult.itemsCount || 0}</p>
              </div>
            </div>
          </div>

          {/* CSV Download */}
          {uploadResult.csvUrl && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">CSV File Ready</p>
                  <p className="text-green-600 text-sm">
                    {uploadResult.itemsCount} item(s) extracted successfully
                  </p>
                </div>
                <a
                  href={uploadResult.csvUrl}
                  download
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV
                </a>
              </div>
            </div>
          )}

          {/* Preview Image */}
          {uploadResult.fileType.startsWith("image/") && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Uploaded Image:</p>
              <img
                src={uploadResult.fileUrl}
                alt="Uploaded file"
                className="max-w-md rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Extracted Data Preview */}
          {uploadResult.extractedData && (
            <div className="mt-4">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                  View Raw Extracted Data (JSON)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-xs max-h-96">
                  {JSON.stringify(uploadResult.extractedData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
          <li>Upload a PDF or image file (JPEG, PNG)</li>
          <li>Gemini AI extracts data from the document</li>
          <li>Download the extracted data as a CSV file</li>
          <li>Review the data in Excel or Google Sheets</li>
        </ol>
      </div>
    </div>
  );
}
