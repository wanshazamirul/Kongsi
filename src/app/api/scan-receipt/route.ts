import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    // ── Tier 1: Scout extracts raw text from image ──
    const ocr = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Read ALL text visible in this image. Output every word, number, and symbol you can see. Include headers, item names, prices, totals, taxes, dates — everything. No analysis, just output the raw text.",
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 500,
    });

    const rawText = ocr.choices[0]?.message?.content || "";

    // ── Tier 2: GPT-OSS 120B structures the text ──
    const structured = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: `Analyze this extracted text from an image. Determine if it's a receipt, bill, or invoice.

If it IS a receipt/bill/invoice, extract the restaurant/merchant name and all line items with prices. Include service charges, taxes, and fees as items.

If it is NOT a receipt (e.g. random text, gibberish, non-receipt content), set isReceipt to false.

Return ONLY valid JSON, no other text:
{
  "isReceipt": true/false,
  "title": "restaurant or merchant name (or empty)",
  "items": [{"name": "item name", "amount": 0.00}]
}

Extracted text:
${rawText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 800,
    });

    const content = structured.choices[0]?.message?.content || "{}";
    const match = content.match(/\{[\s\S]*\}/);
    const data = match ? JSON.parse(match[0]) : { isReceipt: false, title: "", items: [] };

    return NextResponse.json({
      isReceipt: data.isReceipt !== false,
      title: data.title || "Restaurant Bill",
      items: data.items || [],
    });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
