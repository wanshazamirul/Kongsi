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
      model: "meta-llama/llama-4-maverick-17b-128e-instruct",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract data from this receipt/bill as a JSON object with two fields: \"title\" (the restaurant/merchant name) and \"items\". For each item include: name (the item name in original language), amount (item price as number, NOT total). Return ONLY valid JSON, no other text.

Example: {"title":"Restoran Ali Maju","items":[{"name":"Roti Canai","amount":2.50},{"name":"Teh Tarik","amount":3.00}]}

If you can't read it, return {"title":"Restaurant Bill","items":[]}. Include service charges/tax as items. Return ONLY valid JSON.`,
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
    const data = match ? JSON.parse(match[0]) : { title: "Restaurant Bill", items: [] };
    const title = data.title || "Restaurant Bill";
    const items = data.items || [];

    return NextResponse.json({ title, items });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
