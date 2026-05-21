const PB_URL = process.env.NEXT_PUBLIC_PB_URL!;

let adminToken: string | null = null;
let adminTokenExpiry = 0;

async function getAdminToken(): Promise<string> {
  if (adminToken && Date.now() < adminTokenExpiry) return adminToken;

  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: process.env.POCKETBASE_ADMIN_EMAIL,
      password: process.env.POCKETBASE_ADMIN_PASSWORD,
    }),
  });

  if (!res.ok) throw new Error(`Admin auth failed: ${res.status}`);

  const data = await res.json();
  adminToken = data.token;
  adminTokenExpiry = Date.now() + 3500_000;
  return adminToken!;
}

async function pbRequest(path: string, options?: RequestInit): Promise<Response> {
  const token = await getAdminToken();
  return fetch(`${PB_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: token,
      "Content-Type": "application/json",
    },
  });
}

export async function pbGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await pbRequest(`/api/${path}${query}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PB GET ${path} failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function pbPost<T>(path: string, body: unknown): Promise<T> {
  const res = await pbRequest(`/api/${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PB POST ${path} failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function pbPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await pbRequest(`/api/${path}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PB PATCH ${path} failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function pbDelete(path: string): Promise<void> {
  const res = await pbRequest(`/api/${path}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PB DELETE ${path} failed: ${res.status} ${err}`);
  }
}
