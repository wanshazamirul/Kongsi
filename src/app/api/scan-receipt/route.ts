import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Remove data URL prefix if present
    const base64 = image.replace(/^data:image\/\w+;base64,/, "");

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image. First, determine if this is a receipt, bill, or invoice. If it IS a receipt/bill/invoice, extract the data. If it is NOT (e.g. a selfie, cat photo, screenshot of something else, random image), set isReceipt to false.

Return ONLY valid JSON with these fields:
- "isReceipt": true if this is a receipt/bill/invoice, false otherwise
- "title": the restaurant/merchant name (or empty string if not a receipt)
- "items": array of {name (original language), amount (number, NOT total)} (or empty array if not a receipt)

Example receipt: {"isReceipt":true,"title":"Restoran Ali Maju","items":[{"name":"Roti Canai","amount":2.50},{"name":"Teh Tarik","amount":3.00}]}
Example non-receipt: {"isReceipt":false,"title":"","items":[]}

Include service charges/tax as items. Return ONLY valid JSON, no other text.`,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64}` },
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const match = text.match(/\{[\s\S]*\}/);
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
