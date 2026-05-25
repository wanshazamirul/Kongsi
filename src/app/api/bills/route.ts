import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbPost } from "@/lib/pb-server";
import { generateToken } from "@/lib/utils";
import { z } from "zod";

const createBillSchema = z.object({
  title: z.string().min(1).max(200),
  total_amount: z.number().positive(),
  description: z.string().max(500).optional(),
  due_date: z.string().optional(),
  participants: z.array(
    z.object({
      name: z.string().min(1).max(100),
      amount: z.number().positive(),
    })
  ).min(1).max(50),
  line_items: z.array(
    z.object({
      name: z.string().min(1),
      amount: z.number(),
    })
  ).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createBillSchema.parse(body);

    const adminToken = generateToken();

    const bill = await pbPost<{ id: string }>("collections/kongsi_bills/records", {
      title: parsed.title,
      total_amount: parsed.total_amount,
      description: parsed.description || "",
      due_date: parsed.due_date || "",
      admin_token: adminToken,
      line_items: parsed.line_items?.length ? JSON.stringify(parsed.line_items) : "",
    });

    // Create participants with payment tokens
    const createdParticipants = [];
    for (const p of parsed.participants) {
      const paymentToken = generateToken(24);
      const participant = await pbPost<{ id: string }>("collections/kongsi_participants/records", {
        bill_id: bill.id,
        name: p.name,
        amount: p.amount,
        paid: false,
        payment_token: paymentToken,
        status: "unpaid",
      });
      createdParticipants.push({ id: participant.id, name: p.name, payment_token: paymentToken });
    }

    return NextResponse.json({
      id: bill.id,
      public_url: `/b/${bill.id}`,
      admin_url: `/b/${bill.id}/dashboard?token=${adminToken}`,
      admin_token: adminToken,
      participants: createdParticipants,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
