import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet } from "@/lib/pb-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const bill = await pbGet<{
      id: string; title: string; total_amount: number;
      description: string; due_date: string; admin_token: string; admin_qr: string; created: string; line_items: string;
    }>(`collections/kongsi_bills/records/${id}`).catch(() => null);

    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    if (token !== bill.admin_token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const participants = await pbGet<{ items: Array<{ bill_id: string }> }>(
      "collections/kongsi_participants/records",
      { perPage: "100" }
    );

    const filtered = participants.items.filter((p) => p.bill_id === id);

    let line_items = null;
    try { if (bill.line_items) line_items = JSON.parse(bill.line_items); } catch {}

    return NextResponse.json({
      id: bill.id,
      title: bill.title,
      total_amount: bill.total_amount,
      description: bill.description,
      due_date: bill.due_date,
      created: bill.created,
      admin_token: bill.admin_token,
      admin_qr: bill.admin_qr || null,
      line_items,
      participants: filtered,
    });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
