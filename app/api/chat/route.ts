import { NextRequest } from "next/server";
import { streamText, ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { queryInventory, QueryFilters } from "@/lib/queryHelpers";

/**
 * Optimized chat route for inventory queries using Google Gemini via Vercel AI SDK
 * 
 * This is the best approach for this use case because it:
 * 1. Uses Vercel AI SDK's streamText for consistent API
 * 2. Extracts query parameters efficiently with a quick AI call
 * 3. Queries the database with type-safe filters
 * 4. Streams formatted responses for better UX
 */
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return new Response(
        JSON.stringify({ error: "Invalid message format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userQuery = lastMessage.content as string;

    // Step 1: Extract query parameters using a quick, focused AI call
    const extractionResult = await streamText({
      model: google("gemini-2.5-flash-lite"),
      prompt: `Extract query parameters from: "${userQuery}"

Return ONLY valid JSON with optional fields: vendorName, invoiceNumber, itemName, itemCode, minQuantity, maxQuantity.
Example: {"vendorName": "ABC", "minQuantity": 10}
Return {} if no parameters.`,
      maxOutputTokens: 150,
      temperature: 0.1,
    });

    // Collect extraction result
    let extractedText = "";
    for await (const chunk of extractionResult.textStream) {
      extractedText += chunk;
    }

    // Parse extracted JSON
    let filters: QueryFilters = {};
    try {
      const cleanedText = extractedText.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "");
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        filters = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Error parsing extraction:", error);
    }

    // Step 2: Query database with extracted filters
    const items = await queryInventory(filters);

    // Step 3: Format results context
    let resultsContext = "";
    if (items.length === 0) {
      resultsContext = "No inventory items found matching the query criteria.";
    } else {
      resultsContext = `Found ${items.length} inventory item(s):\n\n`;
      items.slice(0, 20).forEach((item, index) => {
        resultsContext += `${index + 1}. ${item.itemName}`;
        resultsContext += ` | Vendor: ${item.vendorName}`;
        resultsContext += ` | Invoice: ${item.invoiceNumber}`;
        resultsContext += ` | Quantity: ${item.quantity}`;
        if (item.itemCode) resultsContext += ` | Code: ${item.itemCode}`;
        if (item.unitPrice) resultsContext += ` | Unit Price: $${item.unitPrice}`;
        resultsContext += `\n`;
      });
      if (items.length > 20) {
        resultsContext += `\n(Showing first 20 of ${items.length} total items)`;
      }
    }

    // Step 4: Stream formatted response using AI SDK
    const result = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: `You are a helpful inventory assistant. Answer user questions about inventory based on the provided data. Present information clearly and conversationally.`,
      messages: [
        ...(messages.slice(0, -1) as ModelMessage[]),
        {
          role: "user",
          content: `${userQuery}\n\nInventory Data:\n${resultsContext}\n\nPlease answer the user's question based on this inventory data.`,
        },
      ] as ModelMessage[],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Error processing chat request" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
