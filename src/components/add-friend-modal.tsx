"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertToWebP } from "@/lib/image-utils";

export interface Contact {
  name: string;
  phone?: string;
  avatar?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, phone: string, avatar?: string) => void;
  editing?: Contact | null;
}

export function AddFriendModal({ open, onClose, onSave, editing }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name || "");
      setPhone(editing.phone || "");
      setAvatar(editing.avatar || null);
    } else {
      setName("");
      setPhone("");
      setAvatar(null);
    }
  }, [editing, open]);

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const webp = await convertToWebP(file);
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(webp);
    } catch { /* ignore */ }
    setUploading(false);
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onSave(name.trim(), phone.trim(), avatar || undefined);
    setName("");
    setPhone("");
    setAvatar(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-on-surface">{editing ? "Edit Friend" : "Add Friend"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container-low">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant hover:border-primary flex items-center justify-center overflow-hidden transition-colors"
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-6 h-6 text-outline" />
            )}
          </button>
          <p className="text-[10px] text-on-surface-variant">Tap to add photo</p>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
        </div>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="bg-surface-container-lowest border-outline-variant rounded-xl mb-3"
          autoFocus
        />
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number (e.g. 012-3456789)"
          type="tel"
          className="bg-surface-container-lowest border-outline-variant rounded-xl mb-6"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || uploading}
          className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold"
        >
          {uploading ? "Processing..." : editing ? "Save Changes" : "Add Friend"}
        </Button>
      </div>
    </div>
  );
}
