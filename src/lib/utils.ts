import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateToken(length = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(bytes[i] % chars.length);
  }
  return token;
}

export function formatRM(amount: number): string {
  return `RM${amount.toFixed(2)}`;
}
