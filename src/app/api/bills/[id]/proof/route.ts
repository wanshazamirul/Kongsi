import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet, pbPatch } from "@/lib/pb-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { participant_id, token, proof_image } = await request.json();

    if (!participant_id || !proof_image) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const participant = await pbGet<{
      id: string; payment_token: string; status: string;
    }>(`collections/kongsi_participants/records/${participant_id}`).catch(() => null);

    if (!participant) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

    // Token is optional — allows upload without token for now
    if (token && token !== participant.payment_token) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    await pbPatch(`collections/kongsi_participants/records/${participant_id}`, {
      proof_image,
      status: "pending",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: safeError(err) }, { status: 500 });
  }
}
