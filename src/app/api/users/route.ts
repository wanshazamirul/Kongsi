import { NextResponse } from "next/server";
import { pbGet, pbPost } from "@/lib/pb-server";

export async function POST(req: Request) {
  try {
    const { device_id, name } = await req.json();
    if (!device_id || !name?.trim()) {
      return NextResponse.json({ error: "device_id and name required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await pbGet<{ items: { id: string; name: string; device_id: string }[] }>(
      `collections/kongsi_users/records`,
      { filter: `device_id="${device_id}"` },
    ).catch(() => null);

    if (existing && existing.items.length > 0) {
      const user = existing.items[0];
      if (user.name !== name.trim()) {
        await pbPost(`collections/kongsi_users/records/${user.id}`, { name: name.trim() });
      }
      return NextResponse.json({ user: { id: user.id, name: name.trim(), device_id } });
    }

    // Create new user
    const user = await pbPost<{ id: string; name: string; device_id: string }>(
      `collections/kongsi_users/records`,
      { device_id, name: name.trim() },
    );

    return NextResponse.json({ user: { id: user.id, name: user.name, device_id: user.device_id } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("device_id");
  if (!deviceId) return NextResponse.json({ error: "device_id required" }, { status: 400 });

  try {
    const result = await pbGet<{ items: { id: string; name: string; device_id: string; avatar?: string }[] }>(
      `collections/kongsi_users/records`,
      { filter: `device_id="${deviceId}"` },
    );
    if (result.items.length > 0) {
      const u = result.items[0];
      return NextResponse.json({ user: { id: u.id, name: u.name, device_id: u.device_id, avatar: u.avatar } });
    }
    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
