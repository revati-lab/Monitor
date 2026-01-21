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

Return ONLY valid JSON with optional fields: vendorName, invoiceNumber, transferNumber, itemName, itemCode, slabName, serialNum, block, minQuantity, maxQuantity.
- transferNumber: transfer/order number (e.g., "15782", "TRF-001")
- slabName: the type/name of slab or material (e.g., "Taj Mahal", "Calacatta", "White Marble")
- vendorName: supplier or vendor company name
- invoiceNumber: invoice number
- serialNum: serial number of a specific slab
- block: block identifier
- itemName: general item name
- itemCode: item SKU or code
- minQuantity/maxQuantity: numeric quantity filters

Example: {"transferNumber": "15782"} or {"slabName": "Taj Mahal"} or {"vendorName": "ABC", "minQuantity": 10}
Return {} if no parameters found.`,
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

    console.log("Extracted filters:", filters);

    // Step 2: Query database with extracted filters
    const items = await queryInventory(filters);

    // Step 3: Format results context with slab information
    let resultsContext = "";
    if (items.length === 0) {
      resultsContext = "No inventory items found matching the query criteria.";
    } else {
      // Calculate totals and group by slab name
      let totalSlabs = 0;
      let totalSf = 0;

      // Group items by slab name for better summary
      const slabGroups: Record<string, { count: number; sf: number; vendor: string; records: typeof items }> = {};

      items.forEach(item => {
        const slabCount = (item.quantitySlabs && item.quantitySlabs > 0) ? item.quantitySlabs : 1;
        const sf = parseFloat(item.quantitySf?.toString() || "0") || 0;
        totalSlabs += slabCount;
        totalSf += sf;

        const slabName = item.slabName || item.itemName || "Unknown";
        if (!slabGroups[slabName]) {
          slabGroups[slabName] = { count: 0, sf: 0, vendor: item.vendorName || "Unknown", records: [] };
        }
        slabGroups[slabName].count += slabCount;
        slabGroups[slabName].sf += sf;
        slabGroups[slabName].records.push(item);
      });

      resultsContext = `Found ${totalSlabs} slabs total (${totalSf.toFixed(2)} SF) across ${items.length} records:\n\n`;

      // Show summary by slab type
      resultsContext += `BREAKDOWN BY SLAB TYPE:\n`;
      Object.entries(slabGroups)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([slabName, data], index) => {
          resultsContext += `${index + 1}. ${slabName}: ${data.count} slabs, ${data.sf.toFixed(2)} SF | Vendor: ${data.vendor}\n`;
        });

      // Show some individual records for detail
      resultsContext += `\nSAMPLE RECORDS (first 10):\n`;
      items.slice(0, 10).forEach((item, index) => {
        const slabCount = (item.quantitySlabs && item.quantitySlabs > 0) ? item.quantitySlabs : 1;
        resultsContext += `- ${item.slabName || item.itemName || "Item"}`;
        if (item.serialNum) resultsContext += ` | Serial: ${item.serialNum}`;
        if (item.block) resultsContext += ` | Block: ${item.block}`;
        resultsContext += ` | ${slabCount} slab(s), ${item.quantitySf || 0} SF\n`;
      });

      resultsContext += `\nTOTAL SUMMARY: ${totalSlabs} slabs, ${totalSf.toFixed(2)} square feet across ${Object.keys(slabGroups).length} slab types.`;
    }

    // Step 4: Stream formatted response using AI SDK
    const result = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: `You are a helpful inventory assistant for a stone/slab business. Answer user questions about inventory based on the provided data.
Key fields include: slabName (type of stone), vendorName (supplier), quantitySlabs (number of slabs), quantitySf (square feet), serialNum, block, bundle.
Present information clearly and conversationally. When asked about quantities, always mention the total number of slabs and square feet if available.`,
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
