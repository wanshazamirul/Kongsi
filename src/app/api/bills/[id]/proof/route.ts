import { safeError } from "@/lib/safe-error";
import { NextResponse } from "next/server";
import { pbGet, pbPatch } from "@/lib/pb-server";

const MAX_PROOF_SIZE = 500_000; // 500KB — matches PB field max

function isValidDataUrl(s: string): boolean {
  return typeof s === "string" && s.startsWith("data:image/") && s.includes("base64,");
}

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

    if (!isValidDataUrl(proof_image)) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    if (proof_image.length > MAX_PROOF_SIZE) {
      return NextResponse.json({ error: "Image too large. Maximum 500KB." }, { status: 400 });
    }

    const participant = await pbGet<{
      id: string; payment_token: string; status: string;
    }>(`collections/kongsi_participants/records/${participant_id}`).catch(() => null);

    if (!participant) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

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
