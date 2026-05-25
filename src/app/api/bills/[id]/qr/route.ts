import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet, pbPatch } from "@/lib/pb-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { qr_image, admin_token } = await request.json();

    if (!qr_image || !admin_token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const bill = await pbGet<{ admin_token: string }>(
      `collections/kongsi_bills/records/${id}`
    ).catch((e) => {
      console.error("[QR Upload] Bill fetch failed:", e);
      return null;
    });

    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    if (admin_token !== bill.admin_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
      await pbPatch(`collections/kongsi_bills/records/${id}`, { admin_qr: qr_image });
      return NextResponse.json({ success: true });
    } catch (patchErr) {
      console.error("[QR Upload] PATCH failed:", patchErr);
      return NextResponse.json({ error: "Failed to save QR. Try a smaller image." }, { status: 500 });
    }
  } catch (err) {
    console.error("[QR Upload] Unexpected error:", err);
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
