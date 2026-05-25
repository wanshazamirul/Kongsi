import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet, pbDelete } from "@/lib/pb-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bill = await pbGet<{ id: string; title: string; total_amount: number; description: string; due_date: string; created: string; line_items: string }>(`collections/kongsi_bills/records/${id}`).catch(() => null);
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

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
      line_items,
      participants: filtered,
    });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { admin_token } = await request.json();

    if (!admin_token) {
      return NextResponse.json({ error: "Missing admin token" }, { status: 400 });
    }

    const bill = await pbGet<{ admin_token: string }>(
      `collections/kongsi_bills/records/${id}`
    ).catch(() => null);

    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    if (admin_token !== bill.admin_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pbDelete(`collections/kongsi_bills/records/${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
