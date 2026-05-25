import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet } from "@/lib/pb-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  try {
    const { id, participantId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const bill = await pbGet<{
      id: string; title: string; total_amount: number; admin_qr: string; line_items: string;
    }>(`collections/kongsi_bills/records/${id}`).catch(() => null);

    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    const participant = await pbGet<{
      id: string; name: string; amount: number; paid: boolean;
      payment_token: string; proof_image: string; status: string;
    }>(`collections/kongsi_participants/records/${participantId}`).catch(() => null);

    if (!participant) return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    if (token && token !== participant.payment_token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    let line_items = null;
    try { if (bill.line_items) line_items = JSON.parse(bill.line_items); } catch {}

    return NextResponse.json({
      id: bill.id,
      title: bill.title,
      total_amount: bill.total_amount,
      admin_qr: bill.admin_qr || null,
      line_items,
      participant: {
        id: participant.id,
        name: participant.name,
        amount: participant.amount,
        paid: participant.paid,
        payment_token: participant.payment_token,
        proof_image: participant.proof_image || null,
        status: participant.status || "unpaid",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
