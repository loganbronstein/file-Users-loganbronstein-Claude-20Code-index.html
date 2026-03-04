/**
 * AI listing generation using Claude vision API.
 * Analyzes item photos and generates marketplace listing details.
 */

import Anthropic from "@anthropic-ai/sdk";

interface ListingDetails {
  title: string;
  description: string;
  priceCents: number;
  category: string;
  condition: string;
}

/**
 * Generate marketplace listing details from item photos using Claude vision.
 */
export async function generateListing(imageUrls: string[]): Promise<ListingDetails> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY must be set for AI listing generation");
  }

  const client = new Anthropic({ apiKey });

  // Build image content blocks
  const imageBlocks: Anthropic.ImageBlockParam[] = await Promise.all(
    imageUrls.map(async (url) => {
      // Fetch the image and convert to base64
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/jpeg";
      const mediaType = contentType as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

      return {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: mediaType,
          data: buffer.toString("base64"),
        },
      };
    }),
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `You are a marketplace listing expert for Sale Advisor, a consignment sales company. Analyze the item(s) in these photos and generate a compelling marketplace listing.

Return ONLY valid JSON with these fields:
{
  "title": "Concise, searchable title (max 80 chars). Include brand if visible.",
  "description": "2-3 paragraph description. Mention dimensions if estimable, material, condition details, brand, style. Be honest but positive. End with 'Listed by Sale Advisor — consignment made easy.'",
  "priceCents": <suggested price in cents based on similar items on Facebook Marketplace/eBay. Be competitive but fair. Use your best estimate.>,
  "category": "<one of: Furniture, Electronics, Appliances, Clothing, Sports, Tools, Home Decor, Kitchen, Outdoor, Toys, Books, Art, Jewelry, Collectibles, Other>",
  "condition": "<one of: New, Like New, Good, Fair, Poor>"
}

Be realistic with pricing. Consider the secondhand market. Higher-ticket items are preferred but price accurately.`,
          },
        ],
      },
    ],
  });

  // Extract text from response
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI");
  }

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = textBlock.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);

  return {
    title: String(parsed.title || "Untitled Item").slice(0, 200),
    description: String(parsed.description || ""),
    priceCents: Math.max(0, Math.round(Number(parsed.priceCents) || 0)),
    category: String(parsed.category || "Other"),
    condition: String(parsed.condition || "Good"),
  };
}
