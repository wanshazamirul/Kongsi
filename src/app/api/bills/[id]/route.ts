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

    const participants = await pbGet<{ items: unknown[] }>(
      "collections/kongsi_participants/records",
      { filter: `bill_id='${id}'`, sort: "created", perPage: "50" }
    );

    return NextResponse.json({
      id: bill.id,
      title: bill.title,
      total_amount: bill.total_amount,
      description: bill.description,
      due_date: bill.due_date,
      created: bill.created,
      participants: participants.items,
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
