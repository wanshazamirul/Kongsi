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
    ).catch(() => null);

    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    if (admin_token !== bill.admin_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await pbPatch(`collections/kongsi_bills/records/${id}`, { admin_qr: qr_image });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
