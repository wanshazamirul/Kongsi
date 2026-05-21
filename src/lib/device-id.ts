// Simple device fingerprint — no cookies, no tracking, just enough to
// recognise returning users across sessions without a password.

export function getDeviceId(): string {
  const stored = localStorage.getItem('kongsi_device_id');
  if (stored) return stored;

  const components = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }

  const id = `dev_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  localStorage.setItem('kongsi_device_id', id);
  return id;
}

export function getDeviceName(): string {
  return localStorage.getItem('kongsi_user_name') || '';
}

export function setDeviceName(name: string) {
  localStorage.setItem('kongsi_user_name', name);
}
