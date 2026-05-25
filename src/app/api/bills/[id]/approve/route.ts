import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet, pbPatch } from "@/lib/pb-server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (rateLimit(`approve:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const { participant_id, admin_token } = await request.json();

    if (!participant_id || !admin_token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify admin token
    const bill = await pbGet<{ admin_token: string }>(
      `collections/kongsi_bills/records/${id}`
    ).catch(() => null);

    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    if (admin_token !== bill.admin_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pbPatch(`collections/kongsi_participants/records/${participant_id}`, {
      status: "paid",
      paid: true,
      paid_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
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
    const { participant_id, admin_token } = await request.json();

    if (!participant_id || !admin_token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify admin token
    const bill = await pbGet<{ admin_token: string }>(
      `collections/kongsi_bills/records/${id}`
    ).catch(() => null);

    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    if (admin_token !== bill.admin_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Revert to unpaid
    await pbPatch(`collections/kongsi_participants/records/${participant_id}`, {
      status: "unpaid",
      proof_image: "",
      paid: false,
      paid_at: "",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
