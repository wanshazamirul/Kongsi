import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet, pbDelete } from "@/lib/pb-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bill = await pbGet<{ id: string; title: string; total_amount: number; description: string; due_date: string; created: string }>(`collections/kongsi_bills/records/${id}`).catch(() => null);
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    const participants = await pbGet<{ items: Array<{ bill_id: string }> }>(
      "collections/kongsi_participants/records",
      { sort: "created", perPage: "100" }
    );

    const filtered = participants.items.filter((p) => p.bill_id === id);

    return NextResponse.json({
      id: bill.id,
      title: bill.title,
      total_amount: bill.total_amount,
      description: bill.description,
      due_date: bill.due_date,
      created: bill.created,
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
    await pbDelete(`collections/kongsi_bills/records/${id}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
