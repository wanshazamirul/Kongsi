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
      { perPage: "100" },
    ).catch(() => null);

    const foundUser = existing?.items.find((u) => u.device_id === device_id);
    if (foundUser) {
      const user = foundUser;
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
      { perPage: "100" },
    );
    const user = result.items.find((u) => u.device_id === deviceId);
    if (user) {
      return NextResponse.json({ user: { id: user.id, name: user.name, device_id: user.device_id, avatar: user.avatar } });
    }
    return NextResponse.json({ user: null });
  } catch {
    return NextResponse.json({ user: null });
  }
}
