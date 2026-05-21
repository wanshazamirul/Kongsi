import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet, pbPatch } from "@/lib/pb-server";
import { z } from "zod";

const paySchema = z.object({
  participant_id: z.string().min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { participant_id } = paySchema.parse(body);

    // Verify participant belongs to this bill
    const participant = await pbGet<{ bill_id: string; paid: boolean }>(
      `collections/kongsi_participants/records/${participant_id}`
    ).catch(() => null);

    if (!participant || participant.bill_id !== id) {
      return NextResponse.json({ error: "Invalid participant" }, { status: 404 });
    }

    if (participant.paid) {
      return NextResponse.json({ error: "Already paid" }, { status: 409 });
    }

    const updated = await pbPatch(
      `collections/kongsi_participants/records/${participant_id}`,
      {
        paid: true,
        paid_at: new Date().toISOString(),
      }
    );

    return NextResponse.json(updated);
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
