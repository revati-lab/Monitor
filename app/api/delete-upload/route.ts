import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileUrl, csvUrl } = body;

    const deletedFiles: string[] = [];
    const errors: string[] = [];

    // Delete the uploaded file
    if (fileUrl) {
      const filePath = join(process.cwd(), "public", fileUrl);
      if (existsSync(filePath)) {
        try {
          await unlink(filePath);
          deletedFiles.push(fileUrl);
          console.log(`🗑️ Deleted uploaded file: ${filePath}`);
        } catch (err: any) {
          console.error(`Failed to delete file: ${filePath}`, err);
          errors.push(`Failed to delete ${fileUrl}: ${err.message}`);
        }
      }
    }

    // Delete the CSV file
    if (csvUrl) {
      const csvPath = join(process.cwd(), "public", csvUrl);
      if (existsSync(csvPath)) {
        try {
          await unlink(csvPath);
          deletedFiles.push(csvUrl);
          console.log(`🗑️ Deleted CSV file: ${csvPath}`);
        } catch (err: any) {
          console.error(`Failed to delete CSV: ${csvPath}`, err);
          errors.push(`Failed to delete ${csvUrl}: ${err.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Delete upload error:", error);
    return NextResponse.json(
      { error: "Failed to delete files", details: error.message },
      { status: 500 }
    );
  }
}
