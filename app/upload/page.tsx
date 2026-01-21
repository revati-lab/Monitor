"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import { ExtractedDataPreview } from "@/components/ExtractedDataPreview";
import { Button } from "@/components/ui/button";

interface UploadResult {
  fileName: string;
  fileUrl: string;
  fileType: string;
  csvUrl?: string;
  itemsCount?: number;
  extractedData?: any;
  error?: string;
  success?: boolean;
}

type UploadState = "idle" | "uploading" | "preview" | "saving" | "saved" | "error";

export default function UploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedItemsCount, setSavedItemsCount] = useState(0);

  const handleUploadComplete = async (data: UploadResult) => {
    setUploadResult(data);

    if (data.error || data.success === false) {
      setUploadState("error");
    } else if (data.extractedData && data.extractedData.items?.length > 0) {
      // Show preview for confirmation
      setUploadState("preview");
    } else {
      // No items extracted
      setUploadState("error");
    }
  };

  const handleUploadStart = () => {
    setUploadState("uploading");
    setUploadResult(null);
    setSaveError(null);
    setSavedItemsCount(0);
  };

  const handleConfirmSave = async () => {
    if (!uploadResult) return;

    setUploadState("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/process-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.fileUrl,
          fileType: uploadResult.fileType,
          extractedData: uploadResult.extractedData,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save data");
      }

      setSavedItemsCount(result.items?.length || 0);
      setUploadState("saved");
    } catch (error: any) {
      console.error("Save error:", error);
      setSaveError(error.message || "Failed to save data to database");
      setUploadState("preview"); // Go back to preview state on error
    }
  };

  const handleCancelPreview = () => {
    setUploadState("idle");
    setUploadResult(null);
    setSaveError(null);
  };

  const handleUploadAnother = () => {
    setUploadState("idle");
    setUploadResult(null);
    setSaveError(null);
    setSavedItemsCount(0);
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Files</h1>
        <p className="text-muted-foreground">
          Upload packing list images or PDFs to extract and save inventory data
        </p>
      </div>

      {/* Upload Section - Show when idle or uploading */}
      {(uploadState === "idle" || uploadState === "uploading") && (
        <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Upload File</h2>
          <FileUpload
            onUploadComplete={handleUploadComplete}
            onUploadStart={handleUploadStart}
          />
        </div>
      )}

      {/* Processing indicator */}
      {uploadState === "uploading" && (
        <div className="bg-primary/10 rounded-lg shadow border border-primary/20 p-6 mb-6">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p className="font-medium text-primary">Processing file...</p>
              <p className="text-sm text-primary/80">Extracting data from your document</p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {uploadState === "error" && uploadResult && (
        <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-destructive">Extraction Failed</h2>
              <p className="text-sm text-muted-foreground">
                {uploadResult.error || "No items could be extracted from this document"}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleUploadAnother}>
            Try Another File
          </Button>
        </div>
      )}

      {/* Preview State - Show extracted data for confirmation */}
      {uploadState === "preview" && uploadResult?.extractedData && (
        <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
          {saveError && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive font-medium">Failed to Save</p>
              <p className="text-destructive/80 text-sm mt-1">{saveError}</p>
            </div>
          )}
          <ExtractedDataPreview
            data={uploadResult.extractedData}
            fileName={uploadResult.fileName}
            fileUrl={uploadResult.fileUrl}
            fileType={uploadResult.fileType}
            onConfirm={handleConfirmSave}
            onCancel={handleCancelPreview}
          />
        </div>
      )}

      {/* Saving State */}
      {uploadState === "saving" && (
        <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <p className="font-medium text-foreground">Saving to database...</p>
              <p className="text-sm text-muted-foreground">Please wait while we save your data</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadState === "saved" && (
        <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
          <div className="text-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
              <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">Successfully Saved!</h2>
            <p className="text-muted-foreground mb-6">
              {savedItemsCount} item{savedItemsCount !== 1 ? "s" : ""} have been added to your inventory
            </p>

            {uploadResult?.csvUrl && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg inline-block">
                <a
                  href={uploadResult.csvUrl}
                  download
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download CSV Copy
                </a>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" onClick={handleUploadAnother}>
                Upload Another File
              </Button>
              <Button asChild>
                <a href="/inventory">View Inventory</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions - Show when idle */}
      {uploadState === "idle" && (
        <div className="bg-muted/50 rounded-lg p-6 border border-border">
          <h3 className="font-semibold text-foreground mb-3">How it works</h3>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground text-sm">
            <li>Upload a PDF or image file (JPEG, PNG)</li>
            <li>Data is automatically extracted from the document</li>
            <li>Review the extracted data in a preview table</li>
            <li>Click &quot;Confirm &amp; Save&quot; to add items to your inventory</li>
          </ol>
        </div>
      )}
    </div>
  );
}
